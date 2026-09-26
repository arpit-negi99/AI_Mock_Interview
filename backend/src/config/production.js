import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const frontendDist = fileURLToPath(new URL('../../../frontend/dist/', import.meta.url));

export function validateProductionConfig(config) {
  if (!config.isProduction) return;
  const missing = [];
  if (!/^mongodb(?:\+srv)?:\/\//.test(config.mongoUri)) missing.push('MONGODB_URI');
  for (const [key, value] of [['JWT_SECRET', config.jwtSecret], ['REFRESH_TOKEN_SECRET', config.refreshTokenSecret]]) {
    if (!value || value.length < 32 || /replace|change.?me|example/i.test(value)) missing.push(`${key} (at least 32 random characters)`);
  }
  if (config.jwtSecret === config.refreshTokenSecret) missing.push('a separate REFRESH_TOKEN_SECRET');
  if (!config.clientOrigins.length || config.clientOrigins.some((origin) => {
    try { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin; } catch { return true; }
  })) missing.push('CLIENT_ORIGIN (HTTPS origin without trailing slash), or RENDER_EXTERNAL_URL');
  if (!Number.isInteger(config.trustProxyHops) || config.trustProxyHops < 0 || config.trustProxyHops > 5) missing.push('TRUST_PROXY_HOPS (0-5)');
  if (config.emailProvider === 'brevo') {
    if (!config.brevoApiKey) missing.push('BREVO_API_KEY');
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.emailFrom)) missing.push('EMAIL_FROM (verified sender email only)');
  } else if (config.emailProvider === 'smtp') {
    if (!(config.smtp.host || config.smtp.service) || !config.smtp.user || !config.smtp.pass || !config.smtp.from) missing.push('SMTP configuration');
  } else missing.push('EMAIL_PROVIDER (brevo or smtp)');
  if (!config.mockAi && config.aiProvider === 'gemini' && !config.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (missing.length) throw new Error(`Production configuration is incomplete: ${missing.join('; ')}`);
}

export function assertFrontendBuild(config) {
  if (config.serveFrontend && !existsSync(new URL('../../../frontend/dist/index.html', import.meta.url))) {
    throw new Error('Frontend build missing. Run npm --prefix frontend run build before starting production.');
  }
}
