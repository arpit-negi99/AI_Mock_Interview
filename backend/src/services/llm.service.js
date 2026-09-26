import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { generateGeminiJson, parseGeminiJson } from './gemini.service.js';

function normalizeProvider(provider = '') {
  const value = provider.trim().toLowerCase();
  if (value === 'google') return 'gemini';
  return value;
}

function defaultModelForProvider(provider) {
  if (provider === 'gemini') return env.geminiModel || 'gemini-3.5-flash';
  return '';
}

function parseModelCandidate(value) {
  const [rawProvider, ...modelParts] = value.split(':');
  if (modelParts.length) {
    const provider = normalizeProvider(rawProvider);
    return { provider, model: modelParts.join(':').trim() || defaultModelForProvider(provider) };
  }

  const provider = normalizeProvider(env.aiProvider || 'gemini');
  return { provider, model: value.trim() || defaultModelForProvider(provider) };
}

function buildModelCandidates() {
  const primaryProvider = normalizeProvider(env.aiProvider || 'gemini');
  const candidates = [
    { provider: primaryProvider, model: defaultModelForProvider(primaryProvider) },
    ...env.aiModelFallbacks.map(parseModelCandidate),
  ];
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.provider}:${candidate.model}`;
    if (!candidate.provider || !candidate.model || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function generateWithCandidate(candidate, options) {
  if (candidate.provider === 'gemini') {
    return generateGeminiJson(options.prompt, { ...options, model: candidate.model });
  }
  throw new AppError(`Unsupported AI provider "${candidate.provider}"`, 500, candidate);
}

export function parseLlmJson(raw, fallback = null) {
  return parseGeminiJson(raw, fallback);
}

export async function generateLlmJson(prompt, { systemInstruction, temperature = 0.5, responseSchema, validate } = {}) {
  const candidates = buildModelCandidates();
  const failures = [];
  const deadline = Date.now() + env.aiTotalTimeoutMs;

  for (const candidate of candidates) {
    if (Date.now() >= deadline) break;
    try {
      const raw = await generateWithCandidate(candidate, { prompt, systemInstruction, temperature, responseSchema, deadline });
      const parsed = parseGeminiJson(raw, null);
      if (!parsed || (validate && !validate(parsed))) {
        throw new AppError('LLM returned invalid JSON', 502, candidate);
      }
      logger.info('LLM call succeeded', { provider: candidate.provider, model: candidate.model });
      return raw;
    } catch (error) {
      failures.push({
        provider: candidate.provider,
        model: candidate.model,
        statusCode: error.statusCode,
        message: error.message,
      });
      logger.warn('LLM model failed; trying next candidate', {
        provider: candidate.provider,
        model: candidate.model,
        error: error.message,
      });
    }
  }

  const last = failures.at(-1);
  throw new AppError(
    `All configured LLM models failed${last ? `; last error: ${last.message}` : ''}`,
    last?.statusCode || 502,
    { failures },
  );
}
