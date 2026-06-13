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

function adaptiveProfile(session) {
  const notes = session.evaluationNotes || [];
  if (!notes.length) return 'No scored answers yet. Start approachable and calibrate from the first response.';
  const average = notes.reduce((sum, note) => sum + Number(note.score || 0), 0) / notes.length;
  if (average >= 8) return `Running average ${average.toFixed(1)}/10. Increase difficulty, challenge edge cases, scalability, and tradeoffs.`;
  if (average <= 4.5) return `Running average ${average.toFixed(1)}/10. Slow down, test fundamentals, and offer one gentle hint before moving on.`;
  return `Running average ${average.toFixed(1)}/10. Maintain medium difficulty and probe for concrete examples.`;
}

function resumeContextBlock(session) {
  const resume = session.resumeContext;
  if (!resume) return 'No resume context provided.';
  return JSON.stringify({
    summary: resume.parsedSummary,
    skills: resume.parsedSkills || [],
    projects: resume.parsedProjects || [],
    experience: resume.parsedExperience || [],
    education: resume.parsedEducation || [],
    certifications: resume.parsedCertifications || [],
  }, null, 2);
}

function interviewContextBlock(session, contextUpdate = null) {
  const memory = contextUpdate?.memory || session.interviewMemory || {};
  const extraction = contextUpdate?.extraction || null;
  const state = contextUpdate?.interviewState || session.interviewState || {};
  const related = contextUpdate?.relatedExchanges || [];
  const suggestedFollowUp = contextUpdate?.suggestedFollowUp || session.contextualFollowUp || null;

  return JSON.stringify({
    latestExtraction: extraction,
    memorySummary: memory.summary || {},
    topicDepth: contextUpdate?.topicDepth || session.topicDepth || [],
    skillGraphTopNodes: (contextUpdate?.skillGraph?.nodes || session.skillGraph?.nodes || []).slice(0, 10),
    relatedPriorExchanges: related.map((item) => ({
      questionText: item.questionText,
      topic: item.topic,
      answerTranscript: item.answerTranscript,
      similarity: Number(item.similarity || 0).toFixed(2),
    })),
    interviewState: state,
    suggestedFollowUp,
  }, null, 2);
}

function interviewerPersona(session) {
  return [
    'You are Alex, a senior technical interviewer at a top-tier tech company with 12 years of industry experience.',
    'Your tone is professional, warm, natural, and spoken. Use brief acknowledgments and transitions, but do not grade the candidate in real time.',
    'Keep every question speakable in 1-3 sentences. Never use markdown, bullet points, numbered lists, code blocks, or written-only formatting in questionText.',
    'Probe vague answers, challenge strong answers with realistic constraints, and gently clarify contradictions from earlier answers.',
    'Start easier, then adapt difficulty from the candidate response quality. For struggling answers, test fundamentals and offer a small hint.',
    session.interviewType === 'resume'
      ? 'Resume mode is active. Reference specific projects, skills, achievements, or roles from the resume whenever possible, and test whether claims are authentic and deep.'
      : 'Prefer practical, real-world interview questions over trivia.',
  ].join('\n');
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
      interviewerPersona(session),
      `You are running a voice mock interview for type "${session.interviewType}".`,
      `Goal: ${typeGoals[session.interviewType] || 'test relevant interview readiness'}.`,
      `Difficulty target: ${session.difficulty}.`,
      `Candidate experience level: ${session.experienceLevel || 'not provided'}.`,
      `Adaptive profile: ${adaptiveProfile(session)}.`,
      'Resume context:',
      resumeContextBlock(session),
      buildRepetitionGuard(session.askedQuestions || []),
      'Available syllabus documents:',
      JSON.stringify(serializeSyllabus(syllabusDocuments), null, 2),
      'Pick a starting topic from the syllabus and ask one open-ended question appropriate for a spoken interview.',
      jsonOnlyInstruction(schema),
    ].join('\n\n');
  },

  processAnswer(session, syllabusDocuments, currentQuestion, answerTranscript, extraConstraint = '', contextUpdate = null) {
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
      interviewerPersona(session),
      `System context: Interview type "${session.interviewType}" with goal "${typeGoals[session.interviewType] || 'assess interview readiness'}".`,
      `Current progress: question ${Number(session.currentQuestionIndex || 0) + 1} of ${session.totalQuestions}.`,
      `Maximum cross-questions allowed for the current question: ${session.maxCrossQuestions}. Current count: ${session.crossQuestionCount || 0}.`,
      `Duration minutes: ${session.duration}. Started at: ${session.startedAt || 'unknown'}.`,
      `Adaptive profile: ${adaptiveProfile(session)}.`,
      'Resume context:',
      resumeContextBlock(session),
      'Dynamic interview memory and extracted answer context:',
      interviewContextBlock(session, contextUpdate),
      buildRepetitionGuard(session.askedQuestions || []),
      extraConstraint ? `Additional hard constraint: ${extraConstraint}` : '',
      'Conversation history:',
      historyBlock(session),
      'Current exchange:',
      JSON.stringify({ currentQuestion, answerTranscript }, null, 2),
      'Available remaining syllabus:',
      JSON.stringify(remaining, null, 2),
      `Topics already covered: ${(session.askedTopics || []).join(', ') || 'none'}.`,
      'Decision rules: ASK_FOLLOWUP for incomplete/vague answers or newly introduced skills/technologies when cross-question limit permits. ASK_CLARIFICATION for vague, contradictory, low-confidence, or unverifiable claims. Use related prior exchanges to connect answers instead of asking independent questions. Increase difficulty only when confidence and topic depth are strong. NEXT_QUESTION for adequate answers or when cross-question limit is reached. END_INTERVIEW when all topics are covered, question limit is reached, or duration elapsed.',
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
      `Adaptive profile: ${adaptiveProfile(session)}.`,
      'Resume context:',
      resumeContextBlock(session),
      'Question history:',
      JSON.stringify(session.questionHistory || [], null, 2),
      'Evaluation notes:',
      JSON.stringify(session.evaluationNotes || [], null, 2),
      jsonOnlyInstruction(schema),
    ].join('\n\n');
  },
};
