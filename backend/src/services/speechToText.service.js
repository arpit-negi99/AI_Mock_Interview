export const speechToTextService = {
  async transcribe({ file, fallbackText }) {
    if (fallbackText) return { transcript: fallbackText, confidence: 1, provider: 'debug-text' };
    if (!file) return { transcript: 'Mock transcript from uploaded audio answer.', confidence: 0.82, provider: 'mock-stt' };
    return {
      transcript: `Mock transcript generated for ${file.originalname || 'audio upload'}.`,
      confidence: 0.84,
      provider: 'mock-stt',
    };
  },
};
