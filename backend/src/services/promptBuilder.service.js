import { buildRepetitionGuard } from './repetitionGuard.service.js';

const typeGoals = {
  core_cse: 'test fundamentals, correctness, and real-world reasoning across core computer science subjects',
  dsa: 'test algorithmic problem solving, complexity analysis, edge cases, and optimization',
  behavioral: 'test communication, ownership, collaboration, and structured reflection',
  resume: 'test authenticity, depth, impact, and defensibility of resume claims',
  project: 'test architecture, tradeoffs, implementation depth, debugging, and scalability reasoning',
};

function serializeSyllabus(syllabusDocuments = []) {
  return syllabusDocuments.map((item) => ({
    id: item.id || item._id?.toString?.(),
    subject: item.subject,
    difficulty: item.difficulty,
    topics: item.topics || [],
    description: item.description || '',
    sampleConcepts: item.sampleConcepts || [],
  }));
}

function historyBlock(session) {
  const history = session.questionHistory || [];
  if (!history.length) return 'No previous exchanges.';
  return history.map((item, index) => [
    `Exchange ${index + 1}`,
    `Question: ${item.questionText}`,
    `Type: ${item.questionType || 'main'}`,
    `Topic: ${item.topic || 'unknown'}`,
    `Answer: ${item.answerTranscript || 'Not answered yet'}`,
  ].join('\n')).join('\n\n');
}

function jsonOnlyInstruction(schema) {
  return [
    'Return only valid JSON. Do not wrap it in markdown fences. Do not include commentary outside JSON.',
    'Required JSON schema:',
    JSON.stringify(schema, null, 2),
  ].join('\n');
}

export const promptBuilder = {
  firstQuestion(session, syllabusDocuments) {
    const schema = {
      questionText: 'the actual question to ask',
      questionType: 'main',
      topic: 'which topic this covers',
      subject: 'which subject this falls under',
      expectedConcepts: ['concept1', 'concept2'],
      difficulty: 'easy/medium/hard',
      reasoning: 'why this question was chosen',
    };

    return [
      `You are running a voice mock interview for type "${session.interviewType}".`,
      `Goal: ${typeGoals[session.interviewType] || 'test relevant interview readiness'}.`,
      `Difficulty target: ${session.difficulty}.`,
      `Candidate experience level: ${session.experienceLevel || 'not provided'}.`,
      buildRepetitionGuard(session.askedQuestions || []),
      'Available syllabus documents:',
      JSON.stringify(serializeSyllabus(syllabusDocuments), null, 2),
      'Pick a starting topic from the syllabus and ask one open-ended question appropriate for a spoken interview.',
      jsonOnlyInstruction(schema),
    ].join('\n\n');
  },

  processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint = '') {
    const schema = {
      decision: 'ASK_FOLLOWUP | ASK_CLARIFICATION | NEXT_QUESTION | END_INTERVIEW',
      questionText: 'the next question or null if ending',
      questionType: 'followup | clarification | main | closing',
      topic: 'topic being addressed',
      subject: 'subject being addressed',
      expectedConcepts: [],
      answerEvaluation: {
        score: '0-10',
        strengths: ['what the candidate did well'],
        gaps: ['what was missing'],
        brief: 'one sentence evaluation for the report',
      },
      reasoning: 'why this decision was made',
    };
    const remaining = serializeSyllabus(syllabusDocuments).map((item) => ({
      ...item,
      topics: item.topics.filter((topic) => !(session.askedTopics || []).includes(topic)),
    }));

    return [
      `System context: Interview type "${session.interviewType}" with goal "${typeGoals[session.interviewType] || 'assess interview readiness'}".`,
      `Current progress: question ${Number(session.currentQuestionIndex || 0) + 1} of ${session.totalQuestions}.`,
      `Maximum cross-questions allowed for the current question: ${session.maxCrossQuestions}. Current count: ${session.crossQuestionCount || 0}.`,
      `Duration minutes: ${session.duration}. Started at: ${session.startedAt || 'unknown'}.`,
      buildRepetitionGuard(session.askedQuestions || []),
      extraConstraint ? `Additional hard constraint: ${extraConstraint}` : '',
      'Conversation history:',
      historyBlock(session),
      'Current exchange:',
      JSON.stringify({ currentQuestion, answerTranscript }, null, 2),
      'Available remaining syllabus:',
      JSON.stringify(remaining, null, 2),
      `Topics already covered: ${(session.askedTopics || []).join(', ') || 'none'}.`,
      'Decision rules: ASK_FOLLOWUP for incomplete/vague answers when cross-question limit permits. ASK_CLARIFICATION for contradictory or uncertain answers. NEXT_QUESTION for adequate answers or when cross-question limit is reached. END_INTERVIEW when all topics are covered, question limit is reached, or duration elapsed.',
      jsonOnlyInstruction(schema),
    ].filter(Boolean).join('\n\n');
  },

  finalEvaluation(session) {
    const schema = {
      overallPerformance: 'brief overall assessment',
      strongestAreas: ['area1'],
      areasNeedingImprovement: ['area1'],
      communicationQuality: 'brief communication assessment',
      recommendedPracticePlan: ['practice step'],
      summary: 'short report summary',
    };

    return [
      'Generate a final voice mock interview evaluation from the full session record.',
      'Question history:',
      JSON.stringify(session.questionHistory || [], null, 2),
      'Evaluation notes:',
      JSON.stringify(session.evaluationNotes || [], null, 2),
      jsonOnlyInstruction(schema),
    ].join('\n\n');
  },
};
