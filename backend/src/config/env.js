import dotenv from 'dotenv';

dotenv.config();

const isTestRun = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test';
const nodeEnv = isTestRun ? 'test' : process.env.NODE_ENV || 'development';
const viteDevPorts = [5173, 5174, 5175, 5176, 5177];
const defaultClientOrigins = viteDevPorts.flatMap((port) => [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);
const configuredClientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const parseCsv = (value = '') => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const fallbackClientOrigins = configuredClientOrigins.length ? configuredClientOrigins : defaultClientOrigins;
const clientOrigins = nodeEnv === 'production'
  ? fallbackClientOrigins
  : Array.from(new Set([...fallbackClientOrigins, ...defaultClientOrigins]));
const allowOpenAi = process.env.ALLOW_OPENAI === 'true';

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: clientOrigins[0] || defaultClientOrigins[0],
  clientOrigins: clientOrigins.length ? clientOrigins : defaultClientOrigins,
  mongoUri: process.env.MONGODB_URI || '',
  mongoConnectRetries: Math.max(1, Number(process.env.MONGODB_CONNECT_RETRIES || 3)),
  mongoRetryDelayMs: Math.max(0, Number(process.env.MONGODB_RETRY_DELAY_MS || 2000)),
  mongoServerSelectionTimeoutMs: Math.max(
    1000,
    Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
  ),
  jwtSecret: process.env.JWT_SECRET || 'replace-this-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'replace-this-development-refresh-secret',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  refreshTokenSessionExpiresIn: process.env.REFRESH_TOKEN_SESSION_EXPIRES_IN || '1d',
  redisUrl: process.env.REDIS_URL || '',
  enableRedis: process.env.ENABLE_REDIS === 'true',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 250),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  aiRateLimitMax: Number(process.env.AI_RATE_LIMIT_MAX || 60),
  mockAi: isTestRun || process.env.MOCK_AI !== 'false',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiModelFallbacks: parseCsv(process.env.AI_MODEL_FALLBACKS || process.env.LLM_MODEL_FALLBACKS || ''),
  aiRequestTimeoutMs: Math.min(20000, Math.max(1000, Number(process.env.AI_REQUEST_TIMEOUT_MS) || 12000)),
  aiTotalTimeoutMs: Math.min(25000, Math.max(1000, Number(process.env.AI_TOTAL_TIMEOUT_MS) || 25000)),
  aiMaxAttempts: Math.min(3, Math.max(1, Number(process.env.AI_MAX_ATTEMPTS) || 2)),
  openaiApiKey: allowOpenAi ? process.env.OPENAI_API_KEY || '' : '',
  openaiModel: allowOpenAi ? process.env.OPENAI_MODEL || '' : '',
  interviewerModel: process.env.INTERVIEWER_MODEL || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || process.env.INTERVIEWER_MODEL || 'gemini-3.5-flash',
  allowLocalAiFallback: isTestRun || process.env.ALLOW_LOCAL_AI_FALLBACK !== 'false',
  interviewerPersona: process.env.INTERVIEWER_PERSONA || 'professional',
  mockStt: isTestRun || process.env.MOCK_STT !== 'false',
  mockTts: isTestRun || process.env.MOCK_TTS !== 'false',
  sttProvider: process.env.STT_PROVIDER || 'gemini',
  openaiWhisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  ttsProvider: process.env.TTS_PROVIDER || 'mock',
  ttsVoice: process.env.TTS_VOICE || 'onyx',
  ttsModel: process.env.TTS_MODEL || 'tts-1',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  smtp: {
    service: process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || process.env.MAIL_SERVICE || '',
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.EMAIL_SERVER || '',
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || 587),
    secure: String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || process.env.MAIL_SECURE || '').toLowerCase() === 'true',
    user: process.env.SMTP_USER || process.env.SMTP_MAIL || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USER || process.env.MAIL_USERNAME || process.env.GMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || process.env.MAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || '',
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.SMTP_MAIL || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USER || process.env.MAIL_USERNAME || process.env.GMAIL_USER || '',
  },
  isProduction: nodeEnv === 'production',
};
