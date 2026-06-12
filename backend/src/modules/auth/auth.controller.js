import bcrypt from 'bcryptjs';
import { ROLES } from '../../constants/roles.js';
import { sendOtpEmail } from '../../services/email.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateToken } from '../../utils/generateToken.js';
import { userRepository } from './auth.repository.js';

const OTP_TTL_MINUTES = 10;

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

    return successResponse(res, {
      message: 'Account verified',
      data: { user: publicUser(verifiedUser), token: generateToken(verifiedUser) },
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;
    const user = await userRepository.findByEmail(email, true);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    return successResponse(res, {
      message: 'Login successful',
      data: { user: publicUser(user), token: generateToken(user) },
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
  logout: asyncHandler(async (_req, res) => successResponse(res, { message: 'Logout successful' })),
};
