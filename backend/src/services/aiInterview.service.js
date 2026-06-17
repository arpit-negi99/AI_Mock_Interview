import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { promptBuilder } from './promptBuilder.service.js';
import { buildRepetitionGuard, isQuestionRepeated } from './repetitionGuard.service.js';
import {
  buildLocalFirstQuestion,
  buildLocalFollowUp,
  buildLocalMainQuestion,
  pickLocalTopic,
} from './localQuestionEngine.service.js';
import { generateLlmJson, parseLlmJson } from './llm.service.js';

function pickTopic(session, syllabusDocuments = []) {
  const selected = pickLocalTopic(session, syllabusDocuments);
  return {
    subject: selected.subject,
    topic: selected.topic,
    concepts: selected.concepts || [],
    difficulty: selected.difficulty || session.difficulty,
  };
}

function pickAdaptiveTopic(session, syllabusDocuments = [], extraction = {}) {
  const covered = new Set(session.askedTopics || []);
  const weakTopics = (session.topicDepth || [])
    .filter((item) => item.depthScore < 0.55 && !covered.has(item.topic))
    .sort((a, b) => a.depthScore - b.depthScore);
  if (weakTopics.length) {
    const match = syllabusDocuments.find((item) => (item.topics || []).includes(weakTopics[0].topic));
    return {
      subject: match?.subject || 'Follow-up coverage',
      topic: weakTopics[0].topic,
      concepts: match?.sampleConcepts || extraction.skills || [],
      difficulty: match?.difficulty || session.interviewState?.nextDifficulty || session.difficulty,
    };
  }

  const mentioned = [...(extraction.skills || []), ...(extraction.technologies || []), ...(extraction.projectNames || [])]
    .find((item) => item && !covered.has(item));
  if (mentioned) {
    return {
      subject: 'Candidate-led thread',
      topic: mentioned,
      concepts: [mentioned, ...(extraction.keywords || []).slice(0, 3)],
      difficulty: session.interviewState?.nextDifficulty || session.difficulty,
    };
  }

  return pickTopic(session, syllabusDocuments);
}

function selectMissingConcept(expectedConcepts = [], answerTranscript = '') {
  const lower = answerTranscript.toLowerCase();
  return expectedConcepts.find((concept) => !lower.includes(String(concept).toLowerCase()));
}

function buildEvidenceFollowUp({ session, currentQuestion, extraction, answerTranscript }) {
  const topic = currentQuestion?.topic || extraction.skills?.[0] || extraction.technologies?.[0] || 'that answer';
  const expected = currentQuestion?.expectedConcepts || [];
  const missingConcept = selectMissingConcept(expected, answerTranscript);
  const technology = extraction.technologies?.[0];

  if (missingConcept) {
    const local = buildLocalFollowUp({
      session,
      currentQuestion,
      extraction: { ...extraction, skills: [missingConcept, ...(extraction.skills || [])] },
      answerTranscript,
    });
    return {
      questionText: local.questionText,
      expectedConcepts: local.expectedConcepts,
      reasoning: `Local interviewer probed missing concept "${missingConcept}" for ${topic}.`,
    };
  }
  if (technology) {
    const local = buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript });
    return {
      questionText: local.questionText,
      expectedConcepts: local.expectedConcepts,
      reasoning: 'Local interviewer probed a technology mentioned in the answer.',
    };
  }
  const local = buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript });
  return {
    questionText: local.questionText,
    expectedConcepts: local.expectedConcepts,
    reasoning: 'Local interviewer asked for evidence based on the current answer.',
  };
}

function fallbackFirstQuestion(session, syllabusDocuments) {
  return buildLocalFirstQuestion(session, syllabusDocuments);
}

function fallbackAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, contextUpdate = null) {
  const wordCount = answerTranscript.split(/\s+/).filter(Boolean).length;
  const canCross = Number(session.crossQuestionCount || 0) < Number(session.maxCrossQuestions || 2);
  const uncertain = /\b(not sure|maybe|i think|confused|don't know|do not know)\b/i.test(answerTranscript);
  const reachedLimit = Number(session.currentQuestionIndex || 0) + 1 >= Number(session.totalQuestions || 5);
  const extraction = contextUpdate?.extraction || {};
  const selected = pickAdaptiveTopic(session, syllabusDocuments, extraction);
  const contextualFollowUp = session.contextualFollowUp;
  const specificity = Number(extraction.specificity || 0);
  const shouldProbeForEvidence = canCross && !contextualFollowUp && !uncertain && (wordCount < 55 || specificity < 0.65);
  const evaluation = {
    score: Math.max(2, Math.min(9, Math.round(((session.interviewState?.confidence || wordCount / 80) * 0.7 + specificity * 0.3) * 10))),
    strengths: [
      wordCount > 20 ? 'Provided some explanatory detail' : 'Attempted the answer',
      extraction.technologies?.length ? `Mentioned ${extraction.technologies.slice(0, 2).join(', ')}` : null,
      extraction.achievements?.length ? 'Included an impact or outcome claim' : null,
    ].filter(Boolean),
    gaps: session.interviewState?.needsClarification || wordCount < 25
      ? ['Needs more depth, ownership, and concrete examples']
      : [
        selectMissingConcept(currentQuestion?.expectedConcepts || [], answerTranscript)
          ? 'Could cover the expected concept more directly'
          : 'Could connect concepts more explicitly',
      ],
    brief: session.interviewState?.needsClarification || wordCount < 25
      ? 'The answer was brief or vague and needs more technical depth.'
      : 'The answer was reasonable but can be sharpened with clearer tradeoffs.',
  };

  if (reachedLimit) {
    return {
      decision: 'END_INTERVIEW',
      questionText: null,
      questionType: 'closing',
      topic: currentQuestion?.topic || session.currentTopic || selected.topic,
      subject: currentQuestion?.subject || selected.subject,
      expectedConcepts: [],
      answerEvaluation: evaluation,
      reasoning: 'Question limit reached.',
    };
  }

  if (uncertain && canCross) {
    return {
      ...buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript, clarify: true }),
      answerEvaluation: evaluation,
    };
  }

  if (contextualFollowUp && canCross) {
    return {
      ...contextualFollowUp,
      answerEvaluation: evaluation,
    };
  }

  if (wordCount < 25 && canCross) {
    return {
      ...buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript }),
      answerEvaluation: evaluation,
    };
  }

  if (shouldProbeForEvidence) {
    const followUp = buildEvidenceFollowUp({ session, currentQuestion, extraction, answerTranscript });
    return {
      decision: 'ASK_FOLLOWUP',
      questionText: followUp.questionText,
      questionType: 'followup',
      topic: currentQuestion?.topic || selected.topic,
      subject: currentQuestion?.subject || selected.subject,
      expectedConcepts: followUp.expectedConcepts,
      answerEvaluation: evaluation,
      reasoning: followUp.reasoning,
    };
  }

  const mainQuestion = buildLocalMainQuestion({ session, syllabusDocuments, extraction, answerTranscript });
  return {
    decision: 'NEXT_QUESTION',
    ...mainQuestion,
    answerEvaluation: evaluation,
  };
}

function fallbackFinalEvaluation(session) {
  const notes = session.evaluationNotes || [];
  const avg = notes.length ? notes.reduce((sum, note) => sum + Number(note.score || 0), 0) / notes.length : 0;
  return {
    overallPerformance: `Average answer quality was ${avg.toFixed(1)} out of 10 across the completed exchanges.`,
    strongestAreas: notes.flatMap((note) => note.strengths || []).slice(0, 3),
    areasNeedingImprovement: notes.flatMap((note) => note.gaps || []).slice(0, 3),
    communicationQuality: 'Communication was understandable; stronger structure and examples would improve interview impact.',
    recommendedPracticePlan: ['Practice concise concept explanations', 'Add examples and edge cases', 'Review gaps topic by topic'],
    summary: 'The session was completed and evaluated from the saved question and answer history.',
    generatedAt: new Date(),
  };
}

async function withLlm(prompt, fallback) {
  if (env.mockAi) return fallback;

  try {
    if (env.nodeEnv === 'development') logger.debug('LLM prompt', { prompt });
    const raw = await generateLlmJson(prompt, {
      systemInstruction: 'You are a strict JSON-only voice interview engine. Ask natural, realistic interview questions that adapt to the candidate level and previous answers.',
      temperature: 0.65,
    });
    if (env.nodeEnv === 'development') logger.debug('LLM raw output', { raw });
    const parsed = parseLlmJson(raw, null);
    if (!parsed) throw new Error('LLM returned invalid JSON');
    return parsed;
  } catch (error) {
    logger.error('LLM call failed', { error: error.message, prompt });
    if (error.statusCode === 429 || env.allowLocalAiFallback) {
      return {
        ...fallback,
        llmUnavailable: true,
        fallbackReason: error.statusCode === 429 ? 'llm_quota_exceeded' : 'llm_unavailable',
      };
    }
    throw error;
  }
}

export const aiInterviewService = {
  async generateFirstQuestion(session, syllabusDocuments) {
    const fallback = fallbackFirstQuestion(session, syllabusDocuments);
    const prompt = promptBuilder.firstQuestion(session, syllabusDocuments);
    return withLlm(prompt, fallback);
  },

  async processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint = '', contextUpdate = null) {
    const contextualSession = {
      ...session,
      contextualFollowUp: contextUpdate?.suggestedFollowUp || session.contextualFollowUp,
    };
    const fallback = fallbackAnswer(contextualSession, syllabusDocuments, currentQuestion, answerTranscript, contextUpdate);
    const prompt = promptBuilder.processAnswer(contextualSession, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint, contextUpdate);
    return withLlm(prompt, fallback);
  },

  async processAnswerWithRepetitionGuard(session, syllabusDocuments, currentQuestion, answerTranscript, contextUpdate = null) {
    let result = await this.processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, '', contextUpdate);
    for (let attempt = 0; attempt < 2 && result.questionText && isQuestionRepeated(result.questionText, session.askedQuestions || []); attempt += 1) {
      const similar = (session.askedQuestions || []).find((question) => isQuestionRepeated(result.questionText, [question]));
      result = await this.processAnswer(
        session,
        syllabusDocuments,
        currentQuestion,
        answerTranscript,
        `The proposed question was too similar to "${similar}". Choose a different topic and wording.`,
        contextUpdate,
      );
    }
    if (result.questionText && isQuestionRepeated(result.questionText, session.askedQuestions || [])) {
      const nextQuestion = buildLocalMainQuestion({
        session: { ...session, askedTopics: [...(session.askedTopics || []), result.topic].filter(Boolean) },
        syllabusDocuments,
        extraction: contextUpdate?.extraction || {},
        answerTranscript,
      });
      result = {
        ...result,
        decision: 'NEXT_QUESTION',
        ...nextQuestion,
        reasoning: 'Code-level repetition guard forced a topic change.',
      };
    }
    return result;
  },

  async generateFinalEvaluation(session) {
    const fallback = fallbackFinalEvaluation(session);
    const prompt = promptBuilder.finalEvaluation(session);
    const result = await withLlm(prompt, fallback);
    return { ...fallback, ...result, generatedAt: result.generatedAt || new Date() };
  },

  buildRepetitionGuard,
};
