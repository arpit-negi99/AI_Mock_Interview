import { INTERVIEW_TYPES } from '../constants/interviewTypes.js';

const conceptFallbacks = ['clarity', 'correctness', 'edge cases', 'tradeoffs'];

const levelAliases = {
  fresher: 'beginner',
  beginner: 'beginner',
  junior: 'beginner',
  entry: 'beginner',
  easy: 'beginner',
  intermediate: 'intermediate',
  mid: 'intermediate',
  medium: 'intermediate',
  experienced: 'intermediate',
  senior: 'advanced',
  advanced: 'advanced',
  lead: 'advanced',
  hard: 'advanced',
};

const styles = ['implementation', 'debugging', 'tradeoff', 'scale', 'testing', 'measurement'];

const openings = {
  first: [
    "I'll start with {topic}.",
    "Let's begin with {topic}.",
    "We'll warm up with {topic}.",
    "I want to start by checking {topic}.",
  ],
  next: [
    "Let's move to {topic}.",
    "Next I want to test {topic}.",
    "Let's switch gears to {topic}.",
    "Now I want to go into {topic}.",
  ],
  followup: [
    'Let me push a little deeper there.',
    'I want to make that more concrete.',
    'Stay with that example for a moment.',
    'Good, now pressure-test that answer.',
  ],
  clarification: [
    'Let us slow that down a bit.',
    'I want to clarify one part of that.',
    'Make that answer more specific for me.',
  ],
};

const bridgeTemplates = [
  'Use your {signal} example if it helps.',
  'Tie it back to {signal} if that gives you a concrete example.',
  'You mentioned {signal}, so you can use that context in your answer.',
  'Connect it to your last answer around {signal} if that is useful.',
];

function hashText(text = '') {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function choose(items = [], seed = '') {
  if (!items.length) return '';
  return items[hashText(seed) % items.length];
}

function render(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || values.topic || 'this topic');
}

function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1').trim();
}

function strongest(items = []) {
  return items.find((item) => item && String(item).trim());
}

function docId(item) {
  return item?.id || item?._id?.toString?.() || '';
}

function normalizeTopics(syllabusDocuments = []) {
  return syllabusDocuments.flatMap((item) => (item.topics || []).map((topic) => ({
    topic,
    subject: item.subject || 'General',
    difficulty: item.difficulty || 'medium',
    concepts: item.sampleConcepts?.length ? item.sampleConcepts : conceptFallbacks,
    sourceId: docId(item),
  })));
}

function resumeTargets(session = {}) {
  const resume = session.resumeContext || {};
  const projectTargets = (resume.parsedProjects || []).map((project) => ({
      topic: project.name || project.title || 'resume project',
      subject: 'Resume project',
      difficulty: session.difficulty || 'medium',
      concepts: project.techStack || project.technologies || resume.parsedSkills || conceptFallbacks,
    }));

  if (session.interviewType === INTERVIEW_TYPES.PROJECT && projectTargets.length) return projectTargets;

  return [
    ...projectTargets,
    ...(resume.parsedExperience || []).map((experience) => ({
      topic: experience.company || experience.role || experience.title || 'work experience',
      subject: 'Resume experience',
      difficulty: session.difficulty || 'medium',
      concepts: experience.skills || resume.parsedSkills || conceptFallbacks,
    })),
    ...(resume.parsedSkills || []).map((skill) => ({
      topic: skill,
      subject: 'Resume skill',
      difficulty: session.difficulty || 'medium',
      concepts: [skill, 'depth', 'tradeoffs'],
    })),
  ].filter((item) => item.topic);
}

function inferCandidateLevel(session = {}, extraction = {}) {
  const explicit = String(session.experienceLevel || '').toLowerCase();
  if (levelAliases[explicit]) return levelAliases[explicit];

  const difficulty = String(session.interviewState?.nextDifficulty || session.difficulty || '').toLowerCase();
  if (levelAliases[difficulty]) return levelAliases[difficulty];

  const confidence = Number(extraction.confidence ?? session.interviewState?.confidence ?? 0);
  const averageDepth = Number(session.interviewState?.averageTopicDepth || 0);
  if (confidence >= 0.78 && averageDepth >= 0.5) return 'advanced';
  if (confidence > 0 && confidence < 0.48) return 'beginner';
  return 'intermediate';
}

function signalFromExtraction(extraction = {}) {
  return strongest(extraction.projectNames)
    || strongest(extraction.technologies)
    || strongest(extraction.skills)
    || strongest(extraction.achievements);
}

function conceptFor(selected = {}, extraction = {}, seed = '') {
  return choose(
    [
      ...(selected.concepts || []),
      ...(extraction.skills || []),
      ...(extraction.technologies || []),
      ...(extraction.keywords || []),
      ...conceptFallbacks,
    ].filter(Boolean),
    seed,
  );
}

function styleFor({ session = {}, selected = {}, extraction = {}, answerTranscript = '', level = 'intermediate' }) {
  return choose(styles, [
    session.id || session._id || '',
    session.currentQuestionIndex || 0,
    session.questionHistory?.length || 0,
    selected.topic,
    extraction.keywords?.join(' '),
    answerTranscript,
    level,
  ].join(':'));
}

function technicalAsk({ level, style, concept }) {
  if (level === 'beginner') {
    return `Explain the idea in simple terms, walk through a small example, and call out one common mistake around ${concept}.`;
  }
  if (level === 'advanced') {
    if (style === 'testing') return `Design a realistic solution, name the edge case most likely to break it, and explain how you would validate the behavior.`;
    if (style === 'measurement') return `Design a realistic solution, predict the first bottleneck, and tell me what metric would prove your approach works.`;
    return `Design a realistic solution, explain the bottleneck or failure mode you would expect first, and tell me how you would validate it.`;
  }
  if (style === 'debugging') return `Walk me through how you would implement it, what could go wrong, and how you would debug the first failure.`;
  if (style === 'testing') return `Explain the approach, then give me one edge case and how you would test it.`;
  return `Explain the approach, compare it with one alternative, and call out the main tradeoff.`;
}

function dsaAsk({ level, style }) {
  if (level === 'beginner') {
    return 'Start with the brute-force idea, then improve it step by step and give me the time and space complexity.';
  }
  if (level === 'advanced') {
    return 'Design the solution for large or streaming input, justify the complexity, name the bottleneck, and tell me how you would validate correctness.';
  }
  if (style === 'testing') return 'Describe the pattern, the data structure you would use, the complexity, and the edge case you would test first.';
  return 'Talk through the intuition, the optimized approach, why it is correct, and where candidates usually make mistakes.';
}

function projectAsk({ level, style, concept }) {
  if (level === 'beginner') {
    return `Explain what you built, what part you personally owned, and one technical challenge around ${concept}.`;
  }
  if (level === 'advanced') {
    if (style === 'scale') return 'Design the next version for 10x usage, identify the bottleneck, and explain the metric you would use to validate the redesign.';
    if (style === 'debugging') return 'Pick the riskiest production failure, walk me through your debugging signals, and explain the fix you would trust.';
    return 'Defend the architecture: what constraint shaped it, what tradeoff did you accept, and how would you validate it under real traffic?';
  }
  if (style === 'measurement') return 'Explain the decision you made, how you measured whether it worked, and what alternative you rejected.';
  if (style === 'debugging') return 'Walk me through a failure you would expect, the signals you would check, and the change you would make.';
  return 'Explain the design choice, the main tradeoff, and how you would improve it if you had another week.';
}

function behavioralAsk({ level, style }) {
  if (level === 'beginner') {
    return 'Give me the situation, what you were responsible for, the action you took, and the result.';
  }
  if (level === 'advanced') {
    return 'Use a specific example where the stakes were real, explain your decision process, the measurable result, and what changed in your leadership style afterward.';
  }
  if (style === 'tradeoff') return 'Use a real example and focus on the tradeoff you had to make, how you communicated it, and what happened next.';
  return 'Tell me the context, your exact action, the outcome, and what you learned.';
}

function askForType({ interviewType, level, style, concept }) {
  if (interviewType === INTERVIEW_TYPES.DSA) return dsaAsk({ level, style });
  if (interviewType === INTERVIEW_TYPES.PROJECT || interviewType === INTERVIEW_TYPES.RESUME) {
    return projectAsk({ level, style, concept });
  }
  if (interviewType === INTERVIEW_TYPES.BEHAVIORAL) return behavioralAsk({ level, style });
  return technicalAsk({ level, style, concept });
}

function composeMainQuestion({ session = {}, selected = {}, extraction = {}, answerTranscript = '', first = false }) {
  const level = inferCandidateLevel(session, extraction);
  const concept = conceptFor(selected, extraction, `${answerTranscript}:${selected.topic}:${level}`);
  const style = styleFor({ session, selected, extraction, answerTranscript, level });
  const opener = render(choose(first ? openings.first : openings.next, `${selected.topic}:${level}:${style}`), selected);
  const signal = signalFromExtraction(extraction);
  const bridge = signal && String(signal).toLowerCase() !== String(selected.topic).toLowerCase()
    ? render(choose(bridgeTemplates, `${signal}:${selected.topic}:${level}`), { signal, topic: selected.topic })
    : '';
  const ask = askForType({ interviewType: session.interviewType, level, style, concept });
  return {
    questionText: cleanText([opener, bridge, ask].filter(Boolean).join(' ')),
    level,
    style,
    concept,
  };
}

function followUpQuestion({ session = {}, currentQuestion = {}, extraction = {}, answerTranscript = '', clarify = false }) {
  const level = inferCandidateLevel(session, extraction);
  const topic = currentQuestion?.topic || extraction.technologies?.[0] || extraction.skills?.[0] || session.currentTopic || 'that topic';
  const concept = extraction.technologies?.[0]
    || extraction.skills?.[0]
    || extraction.keywords?.[0]
    || currentQuestion?.expectedConcepts?.[0]
    || 'the key idea';
  const weakness = strongest(extraction.weaknesses);
  const achievement = strongest(extraction.achievements);
  const style = styleFor({
    session,
    selected: { topic, concepts: currentQuestion?.expectedConcepts || [concept] },
    extraction,
    answerTranscript,
    level,
  });
  const opener = render(choose(clarify ? openings.clarification : openings.followup, `${topic}:${style}:${answerTranscript}`), { topic });

  let ask;
  if (clarify) {
    ask = level === 'advanced'
      ? `What assumption is hidden in your answer about ${topic}, and what evidence would convince you it is safe?`
      : `Give me one concrete example for ${topic}, then explain the reasoning in two or three clear steps.`;
  } else if (weakness) {
    ask = `You mentioned ${weakness}. How did you isolate the root cause, and what would you do differently now?`;
  } else if (achievement) {
    ask = `You mentioned ${achievement}. How did you measure that impact, and what else could have caused the same result?`;
  } else if (level === 'advanced') {
    ask = `Pressure-test your answer around ${topic}: what breaks first, what signal would reveal it, and how would you validate the fix?`;
  } else if (level === 'beginner') {
    ask = `Use a small example for ${topic}, and explain why ${concept} matters in that example.`;
  } else if (style === 'debugging') {
    ask = `If your approach to ${topic} failed in production, what would you check first and why?`;
  } else if (style === 'testing') {
    ask = `What edge case would you test for ${topic}, and what result would tell you your answer is correct?`;
  } else {
    ask = `What tradeoff did you make around ${topic}, and why was it better than the main alternative?`;
  }

  return {
    questionText: cleanText(`${opener} ${ask}`),
    topic,
    concept,
    level,
    style,
  };
}

export function pickLocalTopic(session = {}, syllabusDocuments = [], extraction = {}) {
  const askedTopics = new Set((session.askedTopics || []).map(String));
  const askedQuestions = (session.askedQuestions || []).join(' ').toLowerCase();
  const pool = [
    ...([INTERVIEW_TYPES.RESUME, INTERVIEW_TYPES.PROJECT].includes(session.interviewType) ? resumeTargets(session) : []),
    ...normalizeTopics(syllabusDocuments),
  ];
  const remaining = pool.filter((item) => (
    item.topic
    && !askedTopics.has(item.topic)
    && !askedQuestions.includes(String(item.topic).toLowerCase())
  ));

  if (remaining.length || pool.length) {
    const source = remaining.length ? remaining : pool;
    return choose(source, `${session.id || session._id || ''}:${session.currentQuestionIndex || 0}:${session.questionHistory?.length || 0}`);
  }

  const mentioned = [
    ...(extraction.projectNames || []),
    ...(extraction.technologies || []),
    ...(extraction.skills || []),
  ].find((item) => item && !askedTopics.has(item));

  if (mentioned) {
    return {
      topic: mentioned,
      subject: 'Candidate-led thread',
      difficulty: session.interviewState?.nextDifficulty || session.difficulty || 'medium',
      concepts: [mentioned, ...(extraction.keywords || []).slice(0, 3), 'tradeoffs'],
    };
  }

  return {
    topic: 'Interview readiness',
    subject: 'General',
    difficulty: session.difficulty || 'medium',
    concepts: conceptFallbacks,
  };
}

export function buildLocalFirstQuestion(session = {}, syllabusDocuments = []) {
  const selected = pickLocalTopic(session, syllabusDocuments);
  const composed = composeMainQuestion({ session, selected, first: true });
  return {
    questionText: composed.questionText,
    questionType: 'main',
    topic: selected.topic,
    subject: selected.subject,
    expectedConcepts: selected.concepts || conceptFallbacks,
    difficulty: selected.difficulty || session.difficulty || 'medium',
    candidateLevel: composed.level,
    reasoning: `Generated locally for a ${composed.level} candidate using ${composed.style} interview style.`,
  };
}

export function buildLocalMainQuestion({ session = {}, syllabusDocuments = [], extraction = {}, answerTranscript = '' }) {
  const selected = pickLocalTopic(session, syllabusDocuments, extraction);
  const composed = composeMainQuestion({ session, selected, extraction, answerTranscript });
  return {
    questionText: composed.questionText,
    questionType: 'main',
    topic: selected.topic,
    subject: selected.subject,
    expectedConcepts: selected.concepts || [composed.concept].filter(Boolean),
    difficulty: session.interviewState?.nextDifficulty || selected.difficulty || session.difficulty || 'medium',
    candidateLevel: composed.level,
    reasoning: `Generated locally for a ${composed.level} candidate using ${composed.style} interview style.`,
  };
}

export function buildLocalFollowUp({ session = {}, currentQuestion = {}, extraction = {}, answerTranscript = '', clarify = false }) {
  const composed = followUpQuestion({ session, currentQuestion, extraction, answerTranscript, clarify });
  return {
    decision: clarify ? 'ASK_CLARIFICATION' : 'ASK_FOLLOWUP',
    questionText: composed.questionText,
    questionType: clarify ? 'clarification' : 'followup',
    topic: composed.topic,
    subject: currentQuestion?.subject || 'Interview follow-up',
    expectedConcepts: [composed.concept, 'example', 'tradeoff'].filter(Boolean),
    candidateLevel: composed.level,
    reasoning: clarify
      ? `Generated locally to clarify a ${composed.level} candidate's answer.`
      : `Generated locally as a ${composed.level} ${composed.style} follow-up.`,
  };
}
