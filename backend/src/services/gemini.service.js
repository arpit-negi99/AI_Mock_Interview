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

export async function generateGeminiJson(prompt, { systemInstruction, temperature = 0.7, model: configuredModel } = {}) {
  if (!env.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is required for Gemini interview generation', 500);
  }

  const model = configuredModel || env.geminiModel || 'gemini-3.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': env.geminiApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: systemInstruction
        ? { parts: [{ text: systemInstruction }] }
        : undefined,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const statusCode = response.status === 429 ? 429 : 502;
    const message = response.status === 429
      ? 'Gemini quota or rate limit exceeded. Please wait a bit or check your Gemini API quota.'
      : `Gemini request failed with status ${response.status}: ${body.slice(0, 300)}`;
    throw new AppError(message, statusCode, { provider: 'gemini', model, status: response.status });
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new AppError('Gemini returned an empty response', 502, { provider: 'gemini', model });
  return text;
}

export async function generateGeminiText(parts, { systemInstruction, temperature = 0.2 } = {}) {
  if (!env.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is required for Gemini generation', 500);
  }

  const model = env.geminiModel || 'gemini-3.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': env.geminiApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: systemInstruction
        ? { parts: [{ text: systemInstruction }] }
        : undefined,
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const statusCode = response.status === 429 ? 429 : 502;
    const message = response.status === 429
      ? 'Gemini quota or rate limit exceeded. Please wait a bit or check your Gemini API quota.'
      : `Gemini request failed with status ${response.status}: ${body.slice(0, 300)}`;
    throw new AppError(message, statusCode, { provider: 'gemini', status: response.status });
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new AppError('Gemini returned an empty response', 502, { provider: 'gemini' });
  return text;
}
