import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLES } from '../../constants/roles.js';
import { env } from '../../config/env.js';
import { sendOtpEmail } from '../../services/email.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  generateCsrfToken,
  generateRefreshToken,
  generateToken,
  hashToken,
  verifyRefreshToken,
} from '../../utils/generateToken.js';
import { userRepository } from './auth.repository.js';

const OTP_TTL_MINUTES = 10;
const REFRESH_COOKIE_NAME = 'interviewai_refresh';
const CSRF_COOKIE_NAME = 'interviewai_csrf';

function parseDurationMs(value, fallbackMs) {
  if (typeof value === 'number') return value;
  const match = String(value || '').trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}

function refreshCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: `${env.apiPrefix}/auth`,
    maxAge,
  };
}

function csrfCookieOptions(maxAge) {
  return {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: 'lax',
    path: `${env.apiPrefix}/auth`,
    maxAge,
  };
}

function clearSessionCookies(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions());
}

function publicUser(user) {
  return {
    id: user.id || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
  };
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOtpData(purpose) {
  const otp = generateOtp();
  return {
    otp,
    data: {
      otpHash: await bcrypt.hash(otp, 12),
      otpPurpose: purpose,
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  };
}

async function assertValidOtp(user, otp, purpose) {
  if (!user?.otpHash || user.otpPurpose !== purpose || !user.otpExpiresAt) {
    throw new AppError('OTP was not requested or has expired', 400);
  }
  if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
    throw new AppError('OTP has expired', 400);
  }
  if (!(await bcrypt.compare(otp, user.otpHash))) {
    throw new AppError('Invalid OTP', 400);
  }
}

async function createSession(res, user, rememberMe = true) {
  const refreshExpiresIn = rememberMe ? env.refreshTokenExpiresIn : env.refreshTokenSessionExpiresIn;
  const refreshMaxAge = rememberMe ? parseDurationMs(refreshExpiresIn, 30 * 24 * 60 * 60 * 1000) : undefined;
  const refreshToken = generateRefreshToken(user, refreshExpiresIn, rememberMe);
  const csrfToken = generateCsrfToken();

  await userRepository.updateById(user.id || user._id.toString(), {
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(Date.now() + parseDurationMs(refreshExpiresIn, 24 * 60 * 60 * 1000)),
    csrfTokenHash: hashToken(csrfToken),
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(refreshMaxAge));
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions(refreshMaxAge));

  return {
    user: publicUser(user),
    token: generateToken(user),
    csrfToken,
  };
}

function assertCsrf(req, user) {
  const csrfToken = req.get('x-csrf-token');
  if (!csrfToken || !user?.csrfTokenHash || hashToken(csrfToken) !== user.csrfTokenHash) {
    throw new AppError('Invalid CSRF token', 403);
  }
}

async function resolveRefreshSession(req) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) throw new AppError('Refresh token is missing', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    const status = error instanceof jwt.TokenExpiredError ? 401 : 403;
    throw new AppError('Refresh token is invalid or expired', status);
  }

  const user = await userRepository.findById(decoded.id, true);
  if (!user || user.isActive === false) throw new AppError('User not found or inactive', 401);
  if (!user.isVerified) throw new AppError('Please verify your email before signing in', 403);
  if (!user.refreshTokenHash || hashToken(refreshToken) !== user.refreshTokenHash) {
    throw new AppError('Refresh token has been revoked', 401);
  }
  if (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt).getTime() < Date.now()) {
    throw new AppError('Refresh token has expired', 401);
  }

  return { user, rememberMe: decoded.rememberMe !== false };
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const payload = req.validated.body;
    const email = payload.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing?.isVerified) throw new AppError('Email is already registered', 409);

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const { otp, data: otpData } = await createOtpData('register');
    const userData = {
      name: payload.name,
      email,
      password: hashedPassword,
      role: payload.role || ROLES.CANDIDATE,
      isVerified: false,
      isActive: true,
      ...otpData,
    };

    const pendingUser = existing
      ? await userRepository.updateById(existing.id || existing._id.toString(), userData)
      : await userRepository.create(userData);

    try {
      await sendOtpEmail({
        to: email,
        name: payload.name,
        otp,
        purpose: 'register',
        expiresInMinutes: OTP_TTL_MINUTES,
      });
    } catch (error) {
      await userRepository.deleteById(pendingUser.id || pendingUser._id.toString());
      throw error;
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Verification OTP sent to email',
      data: { expiresInMinutes: OTP_TTL_MINUTES },
    });
  }),

  verifyRegistration: asyncHandler(async (req, res) => {
    const { email, otp } = req.validated.body;
    const user = await userRepository.findByEmail(email, false, true);
    if (!user) throw new AppError('Account not found', 404);
    if (user.isVerified) throw new AppError('Account is already verified', 409);

    await assertValidOtp(user, otp, 'register');
    const verifiedUser = await userRepository.updateById(user.id || user._id.toString(), {
      isVerified: true,
      otpHash: null,
      otpPurpose: null,
      otpExpiresAt: null,
    });

    const session = await createSession(res, verifiedUser);

    return successResponse(res, {
      message: 'Account verified',
      data: session,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password, rememberMe = true } = req.validated.body;
    const user = await userRepository.findByEmail(email.toLowerCase(), true);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (user.isActive === false) throw new AppError('This account is disabled', 403);
    if (!user.isVerified) throw new AppError('Please verify your email before signing in', 403);

    return successResponse(res, {
      message: 'Login successful',
      data: await createSession(res, user, rememberMe),
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const { user, rememberMe } = await resolveRefreshSession(req);
    assertCsrf(req, user);

    return successResponse(res, {
      message: 'Session refreshed',
      data: await createSession(res, user, rememberMe),
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.validated.body;
    const user = await userRepository.findByEmail(email);
    if (!user || user.isActive === false) {
      return successResponse(res, { message: 'If that email exists, a reset OTP has been generated' });
    }

    const { otp, data: otpData } = await createOtpData('reset-password');
    await userRepository.updateById(user.id || user._id.toString(), otpData);
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: 'reset-password',
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    return successResponse(res, {
      message: 'Password reset OTP sent to email',
      data: { expiresInMinutes: OTP_TTL_MINUTES },
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { email, otp, password } = req.validated.body;
    const user = await userRepository.findByEmail(email, false, true);
    if (!user || user.isActive === false) throw new AppError('Account not found', 404);

    await assertValidOtp(user, otp, 'reset-password');
    await userRepository.updateById(user.id || user._id.toString(), {
      password: await bcrypt.hash(password, 12),
      otpHash: null,
      otpPurpose: null,
      otpExpiresAt: null,
      isVerified: true,
    });

    return successResponse(res, { message: 'Password reset successful' });
  }),

  me: asyncHandler(async (req, res) => successResponse(res, { data: { user: req.user } })),
  logout: asyncHandler(async (req, res) => {
    try {
      const { user } = await resolveRefreshSession(req);
      assertCsrf(req, user);
      await userRepository.updateById(user.id || user._id.toString(), {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
        csrfTokenHash: null,
      });
    } catch (error) {
      if (error.statusCode && error.statusCode >= 500) throw error;
    }

    clearSessionCookies(res);
    return successResponse(res, { message: 'Logout successful' });
  }),
};
