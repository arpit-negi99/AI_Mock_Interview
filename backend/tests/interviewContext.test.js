import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MOCK_AI = 'true';

const [
  { KeywordExtractionService },
  { InterviewContextManager },
  { aiInterviewService },
  { interviewReportService },
] = await Promise.all([
  import('../src/services/KeywordExtractionService.js'),
  import('../src/services/InterviewContextManager.js'),
  import('../src/services/aiInterview.service.js'),
  import('../src/services/interviewReport.service.js'),
]);

test('extracts keywords, skills, technologies, claims, achievements, weaknesses, and projects', () => {
  const result = KeywordExtractionService.extract(
    'I built an e-commerce platform using React, Redux, and Node.js. I reduced checkout latency by 40%, but deployment was challenging.',
    { expectedConcepts: ['tradeoffs'] },
  );

  assert.ok(result.keywords.includes('React'));
  assert.ok(result.technologies.includes('React'));
  assert.ok(result.technologies.includes('Redux'));
  assert.ok(result.technologies.includes('Node.js'));
  assert.ok(result.skills.includes('state management'));
  assert.ok(result.skills.includes('deployment'));
  assert.ok(result.experienceClaims.some((claim) => claim.includes('built an e-commerce platform')));
  assert.ok(result.achievements.some((claim) => claim.includes('reduced checkout latency')));
  assert.ok(result.weaknesses.some((claim) => claim.includes('deployment was challenging')));
  assert.ok(result.projectNames.includes('e-commerce platform'));
  assert.equal(result.isVague, false);
});

test('context manager builds memory, graph, topic depth, and a contextual follow-up', async () => {
  const session = {
    interviewType: 'project',
    difficulty: 'medium',
    currentQuestionIndex: 0,
    totalQuestions: 5,
    crossQuestionCount: 0,
    maxCrossQuestions: 2,
    interviewMemory: { exchanges: [], summary: {} },
  };
  const currentQuestion = {
    questionText: 'Tell me about a project using React.',
    questionType: 'main',
    topic: 'React project',
    subject: 'Project Architecture',
    expectedConcepts: ['architecture'],
  };

  const update = await InterviewContextManager.updateAfterAnswer({
    session,
    currentQuestion,
    answerTranscript: 'I built an e-commerce platform using React, Redux, and Node.js with cached product pages.',
  });

  assert.equal(update.memory.exchanges.length, 1);
  assert.ok(update.memory.summary.technologies.includes('Redux'));
  assert.ok(update.skillGraph.nodes.some((node) => node.label === 'Redux'));
  assert.ok(update.conversationGraph.nodes.length >= 1);
  assert.ok(update.topicDepth[0].depthScore > 0);
  assert.equal(update.interviewState.answerQuality, 'medium');
  assert.equal(update.suggestedFollowUp.questionType, 'followup');
  assert.match(update.suggestedFollowUp.questionText, /Redux|React|Node\.js/);
});

test('fallback answer uses contextual follow-up when LLM is unavailable', async () => {
  const session = {
    interviewType: 'project',
    difficulty: 'medium',
    currentQuestionIndex: 0,
    totalQuestions: 5,
    crossQuestionCount: 0,
    maxCrossQuestions: 2,
    askedQuestions: ['Tell me about a project using React.'],
    askedTopics: ['React project'],
    interviewState: { confidence: 0.7, needsClarification: false },
  };
  const currentQuestion = {
    questionText: 'Tell me about a project using React.',
    questionType: 'main',
    topic: 'React project',
    subject: 'Project Architecture',
    expectedConcepts: ['architecture'],
  };
  const contextUpdate = await InterviewContextManager.updateAfterAnswer({
    session,
    currentQuestion,
    answerTranscript: 'I built an e-commerce platform using React, Redux, and Node.js with cached product pages.',
  });

  const result = await aiInterviewService.processAnswerWithRepetitionGuard(
    { ...session, ...{
      interviewMemory: contextUpdate.memory,
      skillGraph: contextUpdate.skillGraph,
      conversationGraph: contextUpdate.conversationGraph,
      topicDepth: contextUpdate.topicDepth,
      interviewState: contextUpdate.interviewState,
    } },
    [],
    currentQuestion,
    'I built an e-commerce platform using React, Redux, and Node.js with cached product pages.',
    contextUpdate,
  );

  assert.equal(result.decision, 'ASK_FOLLOWUP');
  assert.equal(result.questionType, 'followup');
  assert.match(result.questionText, /Redux|React|Node\.js/);
  assert.ok(result.answerEvaluation.score >= 2);
});

test('builds professional report exports and analytics payloads', () => {
  const report = interviewReportService.buildReport({
    id: 'session-1',
    candidate: 'candidate-1',
    interviewType: 'project',
    startedAt: new Date('2026-06-13T10:00:00Z'),
    endedAt: new Date('2026-06-13T10:20:00Z'),
    totalQuestions: 2,
    interviewMemory: {
      summary: {
        skills: ['state management', 'API design'],
        technologies: ['React', 'Redux', 'Node.js'],
      },
    },
    skillGraph: { nodes: [{ label: 'React', weight: 2 }, { label: 'Redux', weight: 2 }, { label: 'Node.js', weight: 1.5 }] },
    questionHistory: [{
      questionText: 'Tell me about a project using React.',
      topic: 'React',
      expectedConcepts: ['state management'],
      answerTranscript: 'I built an e-commerce platform using React, Redux, and Node.js.',
      extractedContext: {
        confidence: 0.8,
        specificity: 0.7,
        skills: ['state management'],
        technologies: ['React', 'Redux', 'Node.js'],
        achievements: ['launched checkout for users'],
        experienceClaims: ['I built an e-commerce platform using React, Redux, and Node.js'],
      },
    }],
    evaluationNotes: [{
      topic: 'React',
      score: 8,
      strengths: ['Concrete technology stack'],
      gaps: ['Could explain deployment more deeply'],
    }],
    finalEvaluation: {
      strongestAreas: ['React implementation detail'],
      areasNeedingImprovement: ['Deployment depth'],
      summary: 'Good project discussion with room for deeper operational detail.',
    },
  });

  const csv = interviewReportService.exportReport(report, 'csv');
  const pdf = interviewReportService.exportReport(report, 'pdf');
  const analytics = interviewReportService.analyticsFromReports([report], 'all');

  assert.equal(report.candidateInfo.name, 'Candidate');
  assert.ok(report.skillsAssessed.includes('React'));
  assert.ok(report.performanceAnalysis.technicalKnowledge > 0);
  assert.ok(report.aiFeedback.interviewReadinessScore > 0);
  assert.match(csv.body, /Final Score/);
  assert.equal(pdf.contentType, 'application/pdf');
  assert.equal(analytics.summary.interviewCount, 1);
  assert.equal(analytics.interviewHistory[0].sessionId, 'session-1');
});
