import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'replace-this-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || '',
  enableRedis: process.env.ENABLE_REDIS === 'true',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 250),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  aiRateLimitMax: Number(process.env.AI_RATE_LIMIT_MAX || 60),
  mockAi: process.env.MOCK_AI !== 'false',
  mockStt: process.env.MOCK_STT !== 'false',
  mockTts: process.env.MOCK_TTS !== 'false',
  isProduction: process.env.NODE_ENV === 'production',
};
