export const textToSpeechService = {
  async synthesize({ text, voice = 'default' }) {
    return {
      audioUrl: null,
      audioContent: null,
      provider: 'mock-tts',
      voice,
      text,
    };
  },
};
