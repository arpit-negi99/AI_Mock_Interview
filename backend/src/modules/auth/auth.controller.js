import bcrypt from 'bcryptjs';
import { ROLES } from '../../constants/roles.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateToken } from '../../utils/generateToken.js';
import { userRepository } from './auth.repository.js';

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

export const authController = {
  register: asyncHandler(async (req, res) => {
    const payload = req.validated.body;
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) throw new AppError('Email is already registered', 409);

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const user = await userRepository.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: payload.role || ROLES.CANDIDATE,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: { user: publicUser(user), token: generateToken(user) },
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

  me: asyncHandler(async (req, res) => successResponse(res, { data: { user: req.user } })),
  logout: asyncHandler(async (_req, res) => successResponse(res, { message: 'Logout successful' })),
};
