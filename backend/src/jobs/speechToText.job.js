import { speechToTextService } from '../services/speechToText.service.js';

export async function speechToTextJob(payload) {
  return speechToTextService.transcribe(payload);
}
