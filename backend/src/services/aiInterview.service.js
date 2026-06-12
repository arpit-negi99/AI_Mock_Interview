import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { promptBuilder } from './promptBuilder.service.js';
import { buildRepetitionGuard, isQuestionRepeated } from './repetitionGuard.service.js';

function stripCodeFences(text = '') {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(stripCodeFences(raw));
  } catch {
    return fallback;
  }
}

function firstSyllabus(syllabusDocuments = []) {
  return syllabusDocuments[0] || { subject: 'General', topics: ['Interview readiness'], sampleConcepts: ['clarity', 'correctness'], difficulty: 'medium' };
}

function pickTopic(session, syllabusDocuments = []) {
  const covered = new Set(session.askedTopics || []);
  for (const item of syllabusDocuments) {
    const topic = (item.topics || []).find((value) => !covered.has(value));
    if (topic) return { subject: item.subject, topic, concepts: item.sampleConcepts || [], difficulty: item.difficulty || session.difficulty };
  }
  const fallback = firstSyllabus(syllabusDocuments);
  return { subject: fallback.subject, topic: fallback.topics?.[0] || 'Interview readiness', concepts: fallback.sampleConcepts || [], difficulty: fallback.difficulty || session.difficulty };
}

function fallbackFirstQuestion(session, syllabusDocuments) {
  const selected = pickTopic(session, syllabusDocuments);
  return {
    questionText: `Let's start with ${selected.topic}. Can you explain the core idea and walk me through a practical example?`,
    questionType: 'main',
    topic: selected.topic,
    subject: selected.subject,
    expectedConcepts: selected.concepts,
    difficulty: selected.difficulty,
    reasoning: 'Fallback first question generated from selected syllabus.',
  };
}

function fallbackAnswer(session, syllabusDocuments, currentQuestion, answerTranscript) {
  const wordCount = answerTranscript.split(/\s+/).filter(Boolean).length;
  const canCross = Number(session.crossQuestionCount || 0) < Number(session.maxCrossQuestions || 2);
  const uncertain = /\b(not sure|maybe|i think|confused|don't know|do not know)\b/i.test(answerTranscript);
  const reachedLimit = Number(session.currentQuestionIndex || 0) + 1 >= Number(session.totalQuestions || 5);
  const selected = pickTopic(session, syllabusDocuments);
  const evaluation = {
    score: Math.max(2, Math.min(8, Math.round(wordCount / 8))),
    strengths: wordCount > 20 ? ['Provided some explanatory detail'] : ['Attempted the answer'],
    gaps: wordCount < 25 ? ['Needs more depth and concrete examples'] : ['Could connect concepts more explicitly'],
    brief: wordCount < 25 ? 'The answer was brief and needs more technical depth.' : 'The answer was reasonable but can be sharpened with clearer tradeoffs.',
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
      decision: 'ASK_CLARIFICATION',
      questionText: `What assumption are you making about ${currentQuestion?.topic || selected.topic}, and how would you verify it?`,
      questionType: 'clarification',
      topic: currentQuestion?.topic || selected.topic,
      subject: currentQuestion?.subject || selected.subject,
      expectedConcepts: currentQuestion?.expectedConcepts || selected.concepts,
      answerEvaluation: evaluation,
      reasoning: 'Fallback clarification for uncertain answer.',
    };
  }

  if (wordCount < 25 && canCross) {
    return {
      decision: 'ASK_FOLLOWUP',
      questionText: `Can you go deeper on ${currentQuestion?.topic || selected.topic} with a concrete example and the key tradeoff involved?`,
      questionType: 'followup',
      topic: currentQuestion?.topic || selected.topic,
      subject: currentQuestion?.subject || selected.subject,
      expectedConcepts: currentQuestion?.expectedConcepts || selected.concepts,
      answerEvaluation: evaluation,
      reasoning: 'Fallback follow-up for brief answer.',
    };
  }

  return {
    decision: 'NEXT_QUESTION',
    questionText: `Now let's move to ${selected.topic}. How would you explain it and what mistakes should a candidate avoid?`,
    questionType: 'main',
    topic: selected.topic,
    subject: selected.subject,
    expectedConcepts: selected.concepts,
    answerEvaluation: evaluation,
    reasoning: 'Fallback moved to the next syllabus topic.',
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

async function callChatCompletion(prompt) {
  if (env.mockAi || !env.openaiApiKey) return null;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages: [
        { role: 'system', content: 'You are a strict JSON-only interview engine.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed with status ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function withLlm(prompt, fallback) {
  try {
    if (env.nodeEnv === 'development') logger.debug('LLM prompt', { prompt });
    const raw = await callChatCompletion(prompt);
    if (!raw) return fallback;
    if (env.nodeEnv === 'development') logger.debug('LLM raw output', { raw });
    return safeJsonParse(raw, fallback);
  } catch (error) {
    logger.error('LLM call failed', { error: error.message, prompt });
    return { ...fallback, llmUnavailable: true };
  }
}

export const aiInterviewService = {
  async generateFirstQuestion(session, syllabusDocuments) {
    const fallback = fallbackFirstQuestion(session, syllabusDocuments);
    const prompt = promptBuilder.firstQuestion(session, syllabusDocuments);
    return withLlm(prompt, fallback);
  },

  async processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint = '') {
    const fallback = fallbackAnswer(session, syllabusDocuments, currentQuestion, answerTranscript);
    const prompt = promptBuilder.processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint);
    return withLlm(prompt, fallback);
  },

  async processAnswerWithRepetitionGuard(session, syllabusDocuments, currentQuestion, answerTranscript) {
    let result = await this.processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript);
    for (let attempt = 0; attempt < 2 && result.questionText && isQuestionRepeated(result.questionText, session.askedQuestions || []); attempt += 1) {
      const similar = (session.askedQuestions || []).find((question) => isQuestionRepeated(result.questionText, [question]));
      result = await this.processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, `The proposed question was too similar to "${similar}". Choose a different topic and wording.`);
    }
    if (result.questionText && isQuestionRepeated(result.questionText, session.askedQuestions || [])) {
      const selected = pickTopic({ ...session, askedTopics: [...(session.askedTopics || []), result.topic].filter(Boolean) }, syllabusDocuments);
      result = {
        ...result,
        decision: 'NEXT_QUESTION',
        questionType: 'main',
        questionText: `Let's switch topics to ${selected.topic}. What are the key ideas and one practical example?`,
        topic: selected.topic,
        subject: selected.subject,
        expectedConcepts: selected.concepts,
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
