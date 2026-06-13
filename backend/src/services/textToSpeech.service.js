import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const phraseCache = new Map();

async function synthesizeWithOpenAi({ text, voice }) {
  if (!env.openaiApiKey) throw new AppError('OPENAI_API_KEY is required for OpenAI text-to-speech', 500);
  const selectedVoice = voice || env.ttsVoice;
  const cacheKey = `${env.ttsModel}:${selectedVoice}:${text}`;
  if (phraseCache.has(cacheKey)) return phraseCache.get(cacheKey);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.ttsModel,
      voice: selectedVoice,
      input: text,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(`Text-to-speech failed with status ${response.status}: ${detail}`, 502);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const result = {
    audioUrl: null,
    audioContent: buffer.toString('base64'),
    mimeType: 'audio/mpeg',
    provider: 'openai-tts',
    model: env.ttsModel,
    voice: selectedVoice,
    text,
  };

  if (text.length < 220) phraseCache.set(cacheKey, result);
  return result;
}

export const textToSpeechService = {
  async synthesize({ text, voice = 'default' }) {
    if (!text?.trim()) throw new AppError('Text is required for speech synthesis', 400);
    if (!env.mockTts && env.ttsProvider === 'openai') return synthesizeWithOpenAi({ text, voice: voice === 'default' ? env.ttsVoice : voice });
    return {
      audioUrl: null,
      audioContent: null,
      mimeType: null,
      provider: 'mock-tts',
      voice,
      text,
    };
  },
};
