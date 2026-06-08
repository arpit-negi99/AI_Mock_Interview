import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const generalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.aiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
