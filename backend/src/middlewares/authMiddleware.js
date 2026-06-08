import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../modules/auth/auth.repository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await userRepository.findById(decoded.id);
  if (!user || user.isActive === false) throw new AppError('User not found or inactive', 401);

  req.user = {
    id: user.id || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
});
