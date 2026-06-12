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
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  mockStt: process.env.MOCK_STT !== 'false',
  mockTts: process.env.MOCK_TTS !== 'false',
  smtp: {
    service: process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || process.env.MAIL_SERVICE || '',
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.EMAIL_SERVER || '',
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || 587),
    secure: String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || process.env.MAIL_SECURE || '').toLowerCase() === 'true',
    user: process.env.SMTP_USER || process.env.SMTP_MAIL || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USER || process.env.MAIL_USERNAME || process.env.GMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || process.env.MAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || '',
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.SMTP_MAIL || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USER || process.env.MAIL_USERNAME || process.env.GMAIL_USER || '',
  },
  isProduction: process.env.NODE_ENV === 'production',
};
