import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function stripCodeFences(text = '') {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

function extractBalancedJsonObject(text = '') {
  const start = text.indexOf('{');
  if (start < 0) return '';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return text.slice(start);
}

function repairJsonText(text = '') {
  return stripCodeFences(text)
    .replace(/\r/g, '')
    .replace(/\n\s*\.\s*"\s*(?=\n?\s*})/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

export function parseGeminiJson(raw, fallback = null) {
  const candidates = [
    stripCodeFences(raw),
    repairJsonText(raw),
    repairJsonText(extractBalancedJsonObject(raw)),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next repair candidate.
    }
  }

  return fallback;
}


const cooldowns = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function resetGeminiCooldowns() { cooldowns.clear(); }

function retryDelay(response, body) {
  const header = response.headers?.get?.('retry-after');
  const seconds = Number(header);
  const headerMs = header ? (Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now()) : 0;
  const detail = body?.error?.details?.find((item) => item.retryDelay)?.retryDelay;
  return Math.max(0, headerMs || 0, detail ? parseFloat(detail) * 1000 || 0 : 0);
}

async function generate(parts, { systemInstruction, temperature, model = env.geminiModel,
  responseSchema, json = false, deadline = Date.now() + env.aiTotalTimeoutMs } = {}) {
  if (!env.geminiApiKey) throw new AppError('Configure GEMINI_API_KEY to enable AI interviews.', 503);
  const cooling = cooldowns.get(model);
  if (cooling?.until > Date.now()) throw new AppError(cooling.message, cooling.statusCode, { provider: 'gemini', model, reason: cooling.reason });
  cooldowns.delete(model);
  for (let attempt = 1; attempt <= env.aiMaxAttempts; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new AppError('AI response timed out. You can continue in practice mode.', 504);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(env.aiRequestTimeoutMs, remaining));
    let failure;
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST', signal: controller.signal,
        headers: { 'x-goog-api-key': env.geminiApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature, maxOutputTokens: 4096,
            ...(json ? { responseMimeType: 'application/json' } : {}),
            ...(responseSchema ? { responseJsonSchema: responseSchema } : {}),
          },
        }),
      });
      if (!response.ok) {
        let body = {};
        try { body = JSON.parse(await response.text()); } catch { /* Do not expose raw provider responses. */ }
        const status = response.status;
        const reason = status === 429 ? 'quota' : [400, 401, 403, 404].includes(status) ? 'configuration' : 'unavailable';
        const message = status === 429 ? 'Gemini quota or rate limit reached. Practice mode is available.'
          : reason === 'configuration' ? 'Gemini could not accept this model or API key. Check the server configuration.'
            : 'Gemini is temporarily unavailable. Please try again shortly.';
        failure = new AppError(message, status === 429 ? 429 : 502, { provider: 'gemini', model, status, reason });
        failure.retryable = [408, 500, 502, 503, 504].includes(status);
        if (status === 429 || reason === 'configuration') {
          cooldowns.set(model, { until: Date.now() + Math.min(3600000, Math.max(status === 429 ? 60000 : 300000, retryDelay(response, body))), message, statusCode: failure.statusCode, reason });
        }
      } else {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('').trim();
        if (!text || (candidate.finishReason && candidate.finishReason !== 'STOP')) {
          throw new AppError('Gemini returned an incomplete or empty response', 502, { provider: 'gemini', model, reason: 'invalid_response' });
        }
        return text;
      }
    } catch (error) {
      failure = error instanceof AppError ? error : new AppError(
        controller.signal.aborted ? 'AI response timed out. Practice mode is available.' : 'Could not reach Gemini. Practice mode is available.',
        controller.signal.aborted ? 504 : 502,
        { provider: 'gemini', model, reason: controller.signal.aborted ? 'timeout' : 'network' },
      );
      if (!(error instanceof AppError)) failure.retryable = true;
    } finally { clearTimeout(timer); }
    if (!failure.retryable || attempt === env.aiMaxAttempts) throw failure;
    const delay = Math.round(400 * 2 ** (attempt - 1) + Math.random() * 200);
    if (Date.now() + delay >= deadline) throw failure;
    await sleep(delay);
  }
}

export async function generateGeminiJson(prompt, options = {}) {
  return generate([{ text: prompt }], { temperature: 0.5, ...options, json: true });
}
export async function generateGeminiText(parts, options = {}) {
  return generate(parts, { temperature: 0.2, ...options });
}
