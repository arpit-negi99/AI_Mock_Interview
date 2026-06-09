import { cacheSession } from '../config/redis.js';
import { INTERVIEW_STATUS } from '../constants/interviewStatus.js';
import { AppError } from '../utils/AppError.js';
import { interviewRepository } from '../modules/interview/interview.repository.js';
import { aiQuestionService } from './aiQuestion.service.js';
import { textToSpeechService } from './textToSpeech.service.js';

function sessionId(session) {
  return session.id || session._id.toString();
}

export const interviewSessionService = {
  async startSession(candidateId, payload) {
    const session = await interviewRepository.createSession({
      candidate: candidateId,
      interviewType: payload.interviewType,
      selectedSubjects: payload.selectedSubjects || [],
      selectedTopics: payload.selectedTopics || [],
      difficulty: payload.difficulty,
      totalQuestions: payload.totalQuestions || 5,
      duration: payload.duration || 15,
      status: INTERVIEW_STATUS.ACTIVE,
      startedAt: new Date(),
      currentQuestionIndex: 0,
      followUpCount: 0,
    });

    const next = await aiQuestionService.generateNextQuestion({ ...session, conversationHistory: [] });
    const message = await this.recordAiQuestion(sessionId(session), next);
    await cacheSession(sessionId(session), session);
    return { session, question: message, tts: await textToSpeechService.synthesize({ text: next.questionText }) };
  },

  async ensureOwnSession(sessionIdValue, user) {
    const session = await interviewRepository.findSessionById(sessionIdValue);
    if (!session) throw new AppError('Interview session not found', 404);
    const owner = session.candidate?.toString?.() || session.candidate;
    if (user.role !== 'admin' && owner !== user.id) throw new AppError('You can access only your own sessions', 403);
    return session;
  },

  async recordAiQuestion(sessionIdValue, aiResult) {
    const messages = await interviewRepository.listMessages(sessionIdValue);
    const type = aiResult.questionType === 'FOLLOW_UP' ? 'follow_up' : aiResult.questionType === 'CLARIFICATION' ? 'clarification' : 'question';
    return interviewRepository.addMessage({
      session: sessionIdValue,
      sender: 'ai',
      type,
      text: aiResult.questionText,
      sequenceNumber: messages.length + 1,
    });
  },

  async processCandidateAnswer({ sessionId: sessionIdValue, user, transcript, audioUrl }) {
    const session = await this.ensureOwnSession(sessionIdValue, user);
    if (session.status !== INTERVIEW_STATUS.ACTIVE) throw new AppError('Interview session is not active', 409);
    const messages = await interviewRepository.listMessages(sessionIdValue);

    await interviewRepository.addMessage({
      session: sessionIdValue,
      sender: 'candidate',
      type: 'answer',
      text: transcript,
      transcript,
      audioUrl,
      sequenceNumber: messages.length + 1,
    });

    const sessionContext = session.toObject?.() || session;
    const aiResult = await aiQuestionService.generateNextQuestion({
      ...sessionContext,
      candidateAnswerTranscript: transcript,
      conversationHistory: await interviewRepository.listMessages(sessionIdValue),
    });

    if (aiResult.nextAction === 'END_INTERVIEW') {
      await interviewRepository.updateSession(sessionIdValue, { status: INTERVIEW_STATUS.ENDED, endedAt: new Date() });
      const closing = await this.recordAiQuestion(sessionIdValue, aiResult);
      return { ended: true, question: closing, aiResult, tts: await textToSpeechService.synthesize({ text: aiResult.questionText }) };
    }

    const isFollowUp = ['ASK_FOLLOW_UP', 'ASK_CLARIFICATION'].includes(aiResult.nextAction);
    const currentQuestionIndex = isFollowUp ? session.currentQuestionIndex : Number(session.currentQuestionIndex || 0) + 1;
    const followUpCount = isFollowUp ? Number(session.followUpCount || 0) + 1 : 0;
    await interviewRepository.updateSession(sessionIdValue, { currentQuestionIndex, followUpCount });
    const question = await this.recordAiQuestion(sessionIdValue, aiResult);
    return { ended: false, question, aiResult, tts: await textToSpeechService.synthesize({ text: aiResult.questionText }) };
  },
};
