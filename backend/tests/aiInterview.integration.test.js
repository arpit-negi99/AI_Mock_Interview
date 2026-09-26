import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERVIEW_STATUS } from '../src/constants/interviewStatus.js';
import { INTERVIEW_TYPES } from '../src/constants/interviewTypes.js';
import { memoryStore } from '../src/utils/memoryStore.js';
import { syllabusRepository } from '../src/modules/syllabus/syllabus.repository.js';
import { interviewSessionService } from '../src/services/interviewSession.service.js';
import { aiInterviewService } from '../src/services/aiInterview.service.js';

test('zero follow-ups is respected and stale submissions cannot advance the session', async () => {
  resetMemoryStore();
  const started = await interviewSessionService.startSession('candidate-reliability', { interviewType: 'dsa', totalQuestions: 3, maxCrossQuestions: 0 });
  const options = { sessionId: started.session.id, user: { id: 'candidate-reliability', role: 'candidate' }, transcript: 'I would inspect every item in the array.', expectedQuestionCount: 1 };
  const result = await interviewSessionService.processCandidateAnswer(options);
  assert.equal(result.session.maxCrossQuestions, 0);
  assert.equal(result.questionType, 'main');
  await assert.rejects(interviewSessionService.processCandidateAnswer(options), (error) => error.statusCode === 409);
  assert.equal(memoryStore.interviewAnswers.length, 1);
});

test('simultaneous answers are serialized and a generation failure leaves no duplicate candidate message', async (t) => {
  resetMemoryStore();
  const started = await interviewSessionService.startSession('candidate-reliability', { interviewType: 'dsa', totalQuestions: 3 });
  const original = aiInterviewService.processAnswerWithRepetitionGuard;
  t.after(() => { aiInterviewService.processAnswerWithRepetitionGuard = original; });
  let release;
  let signalEntered;
  const entered = new Promise((resolve) => { signalEntered = resolve; });
  aiInterviewService.processAnswerWithRepetitionGuard = async () => { signalEntered(); return new Promise((_resolve, reject) => { release = () => reject(new Error('Simulated outage')); }); };
  const options = { sessionId: started.session.id, user: { id: 'candidate-reliability', role: 'candidate' }, transcript: 'I would inspect every item in the array.', expectedQuestionCount: 1 };
  const pending = interviewSessionService.processCandidateAnswer(options);
  await entered;
  await assert.rejects(interviewSessionService.processCandidateAnswer(options), (error) => error.statusCode === 409);
  release();
  await assert.rejects(pending, /Simulated outage/);
  assert.equal(memoryStore.messages.filter((item) => item.sender === 'candidate').length, 0);
  aiInterviewService.processAnswerWithRepetitionGuard = original;
  const retried = await interviewSessionService.processCandidateAnswer(options);
  assert.equal(retried.session.questionHistory.length, 2);
});

function resetMemoryStore() {
  memoryStore.sessions.length = 0;
  memoryStore.messages.length = 0;
  memoryStore.interviewQuestions.length = 0;
  memoryStore.interviewAnswers.length = 0;
  memoryStore.syllabus.length = 0;
  memoryStore.interviewReports.length = 0;
  memoryStore.skillScores.length = 0;
  memoryStore.performanceMetrics.length = 0;
  memoryStore.resumes.length = 0;
}

test('creates syllabus entries and retrieves active entries by interview type', async () => {
  resetMemoryStore();
  const created = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.DSA,
    subject: 'Graphs',
    topics: ['BFS', 'DFS'],
    difficulty: 'medium',
    description: 'Graph traversal fundamentals',
    sampleConcepts: ['visited set', 'queue', 'recursion'],
  });

  const byType = await syllabusRepository.activeByType(INTERVIEW_TYPES.DSA);
  assert.equal(byType.length, 1);
  assert.equal(byType[0].id, created.id);
});

test('starts a session with selected syllabus IDs and returns a first generated question', async () => {
  resetMemoryStore();
  const syllabus = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.CORE_CSE,
    subject: 'Operating Systems',
    topics: ['Deadlocks', 'Paging'],
    difficulty: 'medium',
    sampleConcepts: ['mutual exclusion', 'page table'],
  });

  const result = await interviewSessionService.startSession('candidate-1', {
    interviewType: INTERVIEW_TYPES.CORE_CSE,
    selectedSyllabusIds: [syllabus.id],
    difficulty: 'medium',
    experienceLevel: 'advanced',
    totalQuestions: 3,
    duration: 15,
    maxCrossQuestions: 1,
  });

  assert.ok(result.firstQuestion);
  assert.equal(result.session.experienceLevel, 'advanced');
  assert.equal(result.session.askedQuestions.length, 1);
  assert.equal(result.session.questionHistory.length, 1);
});

test('submitting an incomplete answer receives a clarification and grows askedQuestions without duplicates', async () => {
  resetMemoryStore();
  const syllabus = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.DSA,
    subject: 'Arrays and Strings',
    topics: ['Sliding Window', 'Two Pointers'],
    difficulty: 'medium',
    sampleConcepts: ['window bounds', 'complexity'],
  });
  const started = await interviewSessionService.startSession('candidate-1', {
    interviewType: INTERVIEW_TYPES.DSA,
    selectedSyllabusIds: [syllabus.id],
    difficulty: 'medium',
    totalQuestions: 4,
    duration: 15,
    maxCrossQuestions: 2,
  });

  const result = await interviewSessionService.processCandidateAnswer({
    sessionId: started.session.id,
    user: { id: 'candidate-1', role: 'candidate' },
    transcript: 'I would use a window here briefly',
  });

  assert.equal(result.ended, false);
  assert.equal(result.questionType, 'clarification');
  assert.equal(result.session.askedQuestions.length, 2);
  assert.equal(new Set(result.session.askedQuestions).size, result.session.askedQuestions.length);
});

test('cross-question limit triggers a topic change after enough answers', async () => {
  resetMemoryStore();
  const syllabus = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.DSA,
    subject: 'Arrays and Strings',
    topics: ['Hashing', 'Prefix Sums'],
    difficulty: 'medium',
    sampleConcepts: ['lookup', 'running total'],
  });
  const started = await interviewSessionService.startSession('candidate-1', {
    interviewType: INTERVIEW_TYPES.DSA,
    selectedSyllabusIds: [syllabus.id],
    difficulty: 'medium',
    totalQuestions: 5,
    duration: 15,
    maxCrossQuestions: 1,
  });

  await interviewSessionService.processCandidateAnswer({
    sessionId: started.session.id,
    user: { id: 'candidate-1', role: 'candidate' },
    transcript: 'I would use hashing briefly here',
  });
  const second = await interviewSessionService.processCandidateAnswer({
    sessionId: started.session.id,
    user: { id: 'candidate-1', role: 'candidate' },
    transcript: 'Still brief but enough words to pass validation',
  });

  assert.equal(second.questionType, 'main');
  assert.equal(second.session.crossQuestionCount, 0);
});

test('answers can trigger END_INTERVIEW and report returns evaluation data', async () => {
  resetMemoryStore();
  const syllabus = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.PROJECT,
    subject: 'Project Architecture',
    topics: ['Scalability'],
    difficulty: 'medium',
    sampleConcepts: ['tradeoffs', 'bottlenecks'],
  });
  memoryStore.resumes.push({
    id: 'resume-1',
    candidate: 'candidate-1',
    fileUrl: '/uploads/resumes/test-resume.pdf',
    parsedSummary: 'Candidate built a scalable interview platform.',
    parsedSkills: ['Node.js', 'MongoDB', 'queues'],
    parsedProjects: [{
      name: 'Voice Interview Platform',
      techStack: ['Node.js', 'MongoDB', 'React'],
      description: 'A voice-based mock interview system with adaptive questions.',
      keyAchievements: ['Added adaptive project interviews'],
    }],
    parsedExperience: [],
    parsedEducation: [],
    parsedCertifications: [],
    parsingStatus: 'completed',
    uploadedAt: new Date(),
  });
  const started = await interviewSessionService.startSession('candidate-1', {
    interviewType: INTERVIEW_TYPES.PROJECT,
    selectedSyllabusIds: [syllabus.id],
    difficulty: 'medium',
    totalQuestions: 1,
    duration: 15,
    maxCrossQuestions: 0,
  });

  const ended = await interviewSessionService.processCandidateAnswer({
    sessionId: started.session.id,
    user: { id: 'candidate-1', role: 'candidate' },
    transcript: 'The system scales by separating reads and writes with queues, caching, monitoring, and database indexes.',
  });
  const report = await interviewSessionService.getReport(started.session.id, { id: 'candidate-1', role: 'candidate' });

  assert.equal(ended.ended, true);
  assert.equal(report.session.status, INTERVIEW_STATUS.COMPLETED);
  assert.ok(report.session.finalEvaluation.summary);
  assert.ok(report.session.evaluationNotes.length >= 1);
  assert.ok(ended.interviewReport.finalScore >= 0);
  assert.ok(report.interviewReport.aiFeedback.interviewReadinessScore >= 0);
  assert.ok(report.interviewReport.skillBreakdown.length >= 1);
  assert.ok(memoryStore.interviewQuestions.length >= 1);
  assert.ok(memoryStore.interviewAnswers.length >= 1);
  assert.ok(memoryStore.skillScores.length >= 1);
  assert.ok(memoryStore.performanceMetrics.length >= 1);
});

test('submitting an answer to a completed session receives a 409 error', async () => {
  resetMemoryStore();
  const syllabus = await syllabusRepository.create({
    interviewType: INTERVIEW_TYPES.BEHAVIORAL,
    subject: 'Leadership Scenarios',
    topics: ['Ownership'],
    difficulty: 'easy',
    sampleConcepts: ['action', 'result'],
  });
  const started = await interviewSessionService.startSession('candidate-1', {
    interviewType: INTERVIEW_TYPES.BEHAVIORAL,
    selectedSyllabusIds: [syllabus.id],
    difficulty: 'easy',
    totalQuestions: 1,
    duration: 15,
    maxCrossQuestions: 0,
  });
  await interviewSessionService.endSession(started.session.id, { id: 'candidate-1', role: 'candidate' });

  await assert.rejects(
    () => interviewSessionService.processCandidateAnswer({
      sessionId: started.session.id,
      user: { id: 'candidate-1', role: 'candidate' },
      transcript: 'This should be rejected because the session is already complete.',
    }),
    (error) => error.statusCode === 409,
  );
});
