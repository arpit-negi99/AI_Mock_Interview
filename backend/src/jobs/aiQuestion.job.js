import { aiQuestionService } from '../services/aiQuestion.service.js';

export async function aiQuestionJob(payload) {
  return aiQuestionService.generateNextQuestion(payload);
}
