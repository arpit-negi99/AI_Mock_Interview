import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { generateGeminiText } from './gemini.service.js';

function mockTranscription(file) {
  if (!file) return { transcript: 'Mock transcript from uploaded audio answer.', confidence: 0.82, provider: 'mock-stt' };
  return {
    transcript: `Mock transcript generated for ${file.originalname || 'audio upload'}.`,
    confidence: 0.84,
    language: 'en',
    provider: 'mock-stt',
  };
}

async function transcribeWithOpenAi(file) {
  if (!env.openaiApiKey) throw new AppError('OPENAI_API_KEY is required for OpenAI speech-to-text', 500);
  if (!file?.path) throw new AppError('Audio file is required for transcription', 400);

  const audio = await fs.readFile(file.path);
  const formData = new FormData();
  formData.append('file', new Blob([audio], { type: file.mimetype || 'audio/webm' }), file.originalname || 'answer.webm');
  formData.append('model', env.openaiWhisperModel);
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.openaiApiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(`Speech-to-text failed with status ${response.status}: ${detail}`, 502);
  }

  const data = await response.json();
  return {
    transcript: data.text || '',
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    language: data.language || null,
    duration: data.duration || null,
    provider: 'openai-whisper',
  };
}

async function transcribeWithGemini(file) {
  if (!env.geminiApiKey) throw new AppError('GEMINI_API_KEY is required for Gemini speech-to-text', 500);
  if (!file?.path) throw new AppError('Audio file is required for transcription', 400);

  const audio = await fs.readFile(file.path);
  let transcript = '';
  try {
    transcript = await generateGeminiText([
      {
        text: [
          'Transcribe this interview answer audio exactly.',
          'Return only the spoken transcript as plain text.',
          'Do not add explanations, labels, timestamps, markdown, or guesses.',
          'If the audio is silent or unintelligible, return an empty string.',
        ].join(' '),
      },
      {
        inlineData: {
          mimeType: file.mimetype || 'audio/webm',
          data: audio.toString('base64'),
        },
      },
    ], {
      systemInstruction: 'You are a precise speech-to-text transcription engine.',
      temperature: 0,
    });
  } catch (error) {
    if (error.message === 'Gemini returned an empty response') {
      throw new AppError('No speech was detected in the audio. Please record your answer again.', 400);
    }
    throw error;
  }

  const cleanedTranscript = transcript.replace(/^transcript:\s*/i, '').trim();
  if (!cleanedTranscript) {
    throw new AppError('No speech was detected in the audio. Please record your answer again.', 400);
  }

  return {
    transcript: cleanedTranscript,
    confidence: null,
    language: 'en',
    provider: 'gemini-stt',
  };
}

export const speechToTextService = {
  async transcribe({ file, fallbackText }) {
    if (fallbackText) return { transcript: fallbackText, confidence: 1, provider: 'debug-text' };
    if (env.mockStt) return mockTranscription(file);
    if (env.sttProvider === 'gemini') return transcribeWithGemini(file);
    if (env.sttProvider === 'browser') {
      throw new AppError('Browser STT requires a transcript in the request body; no server transcription was performed.', 400);
    }
    if (env.sttProvider !== 'openai') throw new AppError(`Unsupported STT_PROVIDER "${env.sttProvider}"`, 500);
    return transcribeWithOpenAi(file);
  },
};
