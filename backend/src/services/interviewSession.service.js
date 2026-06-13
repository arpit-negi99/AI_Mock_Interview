import { cacheSession } from '../config/redis.js';
import { INTERVIEW_STATUS } from '../constants/interviewStatus.js';
import { AppError } from '../utils/AppError.js';
import { interviewRepository } from '../modules/interview/interview.repository.js';
import { resumeRepository } from '../modules/resume/resume.repository.js';
import { syllabusRepository } from '../modules/syllabus/syllabus.repository.js';
import { aiInterviewService } from './aiInterview.service.js';
import { InterviewContextManager } from './InterviewContextManager.js';
import { interviewReportService } from './interviewReport.service.js';
import { textToSpeechService } from './textToSpeech.service.js';

function sessionId(session) {
  return session.id || session._id.toString();
}

function toObject(document) {
  return document?.toObject?.() || document;
}

function normalizeQuestionType(type = 'main') {
  const value = String(type).toLowerCase();
  if (value.includes('follow')) return 'followup';
  if (value.includes('clar')) return 'clarification';
  if (value.includes('closing') || value.includes('system')) return 'closing';
  return 'main';
}

function latestOpenQuestion(session) {
  const history = session.questionHistory || [];
  return [...history].reverse().find((item) => !item.answeredAt) || history[history.length - 1] || null;
}

function hasExpired(session) {
  if (!session.startedAt || !session.duration) return false;
  const started = new Date(session.startedAt).getTime();
  return Date.now() - started > Number(session.duration) * 60 * 1000;
}

function wordCount(text = '') {
  return text.split(/\s+/).filter(Boolean).length;
}

function compactResumeContext(resume) {
  if (!resume) return null;
  const value = toObject(resume);
  return {
    parsedSummary: value.parsedSummary || '',
    parsedSkills: value.parsedSkills || [],
    parsedProjects: value.parsedProjects || [],
    parsedExperience: value.parsedExperience || [],
    parsedEducation: value.parsedEducation || [],
    parsedCertifications: value.parsedCertifications || [],
    parsingStatus: value.parsingStatus,
  };
}

export const interviewSessionService = {
  async startSession(candidateId, payload) {
    await syllabusRepository.seedSamples();
    const selectedSyllabusIds = payload.selectedSyllabusIds || [];
    const syllabusDocuments = selectedSyllabusIds.length
      ? await syllabusRepository.findByIds(selectedSyllabusIds)
      : await syllabusRepository.activeByType(payload.interviewType);

    if (!syllabusDocuments.length) throw new AppError('No active syllabus found for this interview type', 404);

    const selectedTopics = [...new Set(syllabusDocuments.flatMap((item) => item.topics || []))];
    const selectedSubjects = [...new Set(syllabusDocuments.map((item) => item.subject).filter(Boolean))];
    const latestResume = payload.interviewType === 'resume' ? await resumeRepository.findLatestByCandidate(candidateId) : null;
    const session = await interviewRepository.createSession({
      candidate: candidateId,
      interviewType: payload.interviewType,
      selectedSubjects: payload.selectedSubjects?.length ? payload.selectedSubjects : selectedSubjects,
      selectedTopics: payload.selectedTopics?.length ? payload.selectedTopics : selectedTopics,
      syllabusIds: syllabusDocuments.map((item) => item.id || item._id),
      difficulty: payload.difficulty,
      totalQuestions: payload.totalQuestions || 5,
      duration: payload.duration || 15,
      status: INTERVIEW_STATUS.CREATED,
      startedAt: new Date(),
      currentQuestionIndex: 0,
      followUpCount: 0,
      crossQuestionCount: 0,
      maxCrossQuestions: payload.maxCrossQuestions || 2,
      askedQuestions: [],
      askedTopics: [],
      resumeContext: compactResumeContext(latestResume),
      interviewMemory: { exchanges: [], summary: {} },
      skillGraph: { nodes: [], edges: [] },
      conversationGraph: { nodes: [], edges: [] },
      topicDepth: [],
      interviewState: {
        answerQuality: 'unknown',
        nextDifficulty: payload.difficulty,
        confidence: 0,
        averageTopicDepth: 0,
        needsClarification: false,
        shouldIncreaseDifficulty: false,
        memoryExchangeCount: 0,
      },
      questionHistory: [],
      evaluationNotes: [],
    });

    const firstQuestion = await aiInterviewService.generateFirstQuestion(toObject(session), syllabusDocuments);
    const questionPatch = { ...this.buildQuestionPatch(toObject(session), firstQuestion, false), status: INTERVIEW_STATUS.ACTIVE };
    const updatedSession = await interviewRepository.updateSession(sessionId(session), questionPatch);
    const message = await this.recordAiQuestion(sessionId(session), firstQuestion);
    await cacheSession(sessionId(session), session);
    return {
      session: updatedSession,
      firstQuestion: firstQuestion.questionText,
      question: message,
      ttsText: firstQuestion.questionText,
      tts: await textToSpeechService.synthesize({ text: firstQuestion.questionText }),
    };
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
    const session = await interviewRepository.findSessionById(sessionIdValue);
    const normalized = normalizeQuestionType(aiResult.questionType);
    const type = normalized === 'followup' ? 'follow_up' : normalized === 'clarification' ? 'clarification' : normalized === 'closing' ? 'system' : 'question';
    const message = await interviewRepository.addMessage({
      session: sessionIdValue,
      sender: 'ai',
      type,
      text: aiResult.questionText,
      sequenceNumber: messages.length + 1,
    });
    if (aiResult.questionText) {
      await interviewRepository.addQuestionRecord({
        candidate: session?.candidate,
        session: sessionIdValue,
        questionText: aiResult.questionText,
        questionType: normalized,
        topic: aiResult.topic,
        subject: aiResult.subject,
        expectedConcepts: aiResult.expectedConcepts || [],
        sequenceNumber: messages.length + 1,
        askedAt: new Date(),
      });
    }
    return message;
  },

  buildQuestionPatch(session, aiResult, incrementMain = true) {
    const questionType = normalizeQuestionType(aiResult.questionType);
    const isMain = questionType === 'main';
    const questionEntry = {
      questionText: aiResult.questionText,
      questionType,
      topic: aiResult.topic || session.currentTopic,
      subject: aiResult.subject,
      expectedConcepts: aiResult.expectedConcepts || [],
      askedAt: new Date(),
    };
    return {
      askedQuestions: [...(session.askedQuestions || []), aiResult.questionText],
      askedTopics: aiResult.topic ? [...new Set([...(session.askedTopics || []), aiResult.topic])] : (session.askedTopics || []),
      currentTopic: aiResult.topic || session.currentTopic,
      questionHistory: [...(session.questionHistory || []), questionEntry],
      currentQuestionIndex: isMain && incrementMain ? Number(session.currentQuestionIndex || 0) + 1 : Number(session.currentQuestionIndex || 0),
      followUpCount: isMain ? 0 : Number(session.followUpCount || 0) + 1,
      crossQuestionCount: isMain ? 0 : Number(session.crossQuestionCount || 0) + 1,
    };
  },

  buildAnswerPatch(session, currentQuestion, transcript, evaluation, extractedContext = null) {
    const history = [...(session.questionHistory || [])];
    const targetIndex = currentQuestion ? history.findIndex((item) => item.questionText === currentQuestion.questionText && !item.answeredAt) : -1;
    const index = targetIndex >= 0 ? targetIndex : history.length - 1;
    if (index >= 0) {
      history[index] = {
        ...history[index],
        answerTranscript: transcript,
        extractedContext: extractedContext || history[index].extractedContext,
        answeredAt: new Date(),
      };
    }
    if (!evaluation) return { questionHistory: history, evaluationNotes: session.evaluationNotes || [] };
    const note = {
      questionText: currentQuestion?.questionText,
      topic: currentQuestion?.topic,
      score: Number(evaluation.score || 0),
      strengths: evaluation.strengths || [],
      gaps: evaluation.gaps || [],
      brief: evaluation.brief || 'Answer processed.',
      createdAt: new Date(),
    };
    return { questionHistory: history, evaluationNotes: [...(session.evaluationNotes || []), note] };
  },

  async processCandidateAnswer({ sessionId: sessionIdValue, user, transcript, audioUrl }) {
    let session = await this.ensureOwnSession(sessionIdValue, user);
    if (session.status !== INTERVIEW_STATUS.ACTIVE) throw new AppError('Interview session is not active', 409);
    if (wordCount(transcript || '') < 5) throw new AppError('Please elaborate before submitting your answer.', 400);
    if (hasExpired(session)) {
      await interviewRepository.updateSession(sessionIdValue, { status: INTERVIEW_STATUS.EXPIRED, endedAt: new Date() });
      throw new AppError('Interview session has expired', 409);
    }

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

    session = toObject(session);
    const syllabusDocuments = await syllabusRepository.findByIds((session.syllabusIds || []).map(String));
    const currentQuestion = latestOpenQuestion(session);
    const contextUpdate = await InterviewContextManager.updateAfterAnswer({ session, currentQuestion, answerTranscript: transcript });
    const contextPatch = {
      interviewMemory: contextUpdate.memory,
      skillGraph: contextUpdate.skillGraph,
      conversationGraph: contextUpdate.conversationGraph,
      topicDepth: contextUpdate.topicDepth,
      interviewState: contextUpdate.interviewState,
    };
    const answerPatch = this.buildAnswerPatch(session, currentQuestion, transcript, null, contextUpdate.extraction);
    session = { ...session, ...answerPatch };
    const aiResult = await aiInterviewService.processAnswerWithRepetitionGuard(
      { ...session, ...contextPatch },
      syllabusDocuments,
      currentQuestion,
      transcript,
      contextUpdate,
    );
    const evaluationPatch = this.buildAnswerPatch(
      toObject(await interviewRepository.findSessionById(sessionIdValue)),
      currentQuestion,
      transcript,
      aiResult.answerEvaluation,
      contextUpdate.extraction,
    );
    await interviewRepository.addAnswerRecord({
      candidate: session.candidate,
      session: sessionIdValue,
      questionText: currentQuestion?.questionText,
      topic: currentQuestion?.topic,
      answerTranscript: transcript,
      extractedContext: contextUpdate.extraction,
      score: aiResult.answerEvaluation?.score,
      sequenceNumber: messages.length + 1,
      answeredAt: new Date(),
    });

    if (aiResult.decision === 'END_INTERVIEW') {
      const evaluating = await interviewRepository.updateSession(sessionIdValue, {
        ...evaluationPatch,
        ...contextPatch,
        status: INTERVIEW_STATUS.EVALUATING,
        endedAt: new Date(),
      });
      const finalEvaluation = await aiInterviewService.generateFinalEvaluation(toObject(evaluating));
      const closingText = 'Thank you. This interview is complete and your evaluation is ready.';
      const completed = await interviewRepository.updateSession(sessionIdValue, { status: INTERVIEW_STATUS.COMPLETED, finalEvaluation });
      const interviewReport = await interviewReportService.generateForSession(toObject(completed));
      return {
        ended: true,
        session: completed,
        interviewReport,
        question: null,
        aiResult,
        finalEvaluation,
        ttsText: closingText,
        tts: await textToSpeechService.synthesize({ text: closingText }),
      };
    }

    const questionPatch = this.buildQuestionPatch({ ...session, ...evaluationPatch }, aiResult);
    const updatedSession = await interviewRepository.updateSession(sessionIdValue, { ...evaluationPatch, ...contextPatch, ...questionPatch });
    const question = await this.recordAiQuestion(sessionIdValue, aiResult);
    return {
      ended: false,
      session: updatedSession,
      question,
      aiResult,
      nextQuestion: aiResult.questionText,
      questionType: normalizeQuestionType(aiResult.questionType),
      topic: aiResult.topic,
      ttsText: aiResult.questionText,
      tts: await textToSpeechService.synthesize({ text: aiResult.questionText }),
    };
  },

  async endSession(sessionIdValue, user) {
    const session = await this.ensureOwnSession(sessionIdValue, user);
    if (![INTERVIEW_STATUS.ACTIVE, INTERVIEW_STATUS.EXPIRED].includes(session.status)) {
      throw new AppError('Interview session cannot be ended from its current state', 409);
    }
    const evaluating = await interviewRepository.updateSession(sessionIdValue, { status: INTERVIEW_STATUS.EVALUATING, endedAt: new Date() });
    const finalEvaluation = await aiInterviewService.generateFinalEvaluation(toObject(evaluating));
    const completed = await interviewRepository.updateSession(sessionIdValue, { status: INTERVIEW_STATUS.COMPLETED, finalEvaluation });
    await interviewReportService.generateForSession(toObject(completed));
    return completed;
  },

  async getReport(sessionIdValue, user) {
    const session = await this.ensureOwnSession(sessionIdValue, user);
    let interviewReport = await interviewReportService.findBySession(sessionIdValue);
    if (!interviewReport && session.status === INTERVIEW_STATUS.COMPLETED) {
      interviewReport = await interviewReportService.generateForSession(toObject(session));
    }
    return { session, messages: await interviewRepository.listMessages(sessionIdValue), interviewReport };
  },
};
