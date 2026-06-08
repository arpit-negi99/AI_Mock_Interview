import { textToSpeechService } from '../services/textToSpeech.service.js';

export async function textToSpeechJob(payload) {
  return textToSpeechService.synthesize(payload);
}
