import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function generateToken(user, expiresIn = env.jwtExpiresIn) {
  return jwt.sign({ id: user.id || user._id?.toString(), role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn,
  });
}

export function generateRefreshToken(user, expiresIn = env.refreshTokenExpiresIn, rememberMe = true) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      tokenId: crypto.randomUUID(),
      type: 'refresh',
      rememberMe,
    },
    env.refreshTokenSecret,
    { expiresIn },
  );
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.refreshTokenSecret);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}
