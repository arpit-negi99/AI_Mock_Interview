import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { generateGeminiJson, resetGeminiCooldowns } from '../src/services/gemini.service.js';
import { aiInterviewService } from '../src/services/aiInterview.service.js';
import { KeywordExtractionService } from '../src/services/KeywordExtractionService.js';
import { interviewOutputs, outputSchema } from '../src/services/interviewOutput.service.js';
import { practiceScenario, technicalAnswerProbe } from '../src/services/practiceScenarios.service.js';
import { interviewReportService } from '../src/services/interviewReport.service.js';
import { sendOtpEmail } from '../src/services/email.service.js';
import nodemailer from 'nodemailer';

const first = { questionText: 'How would you find the cause of a slow database query?', questionType: 'main', topic: 'Databases', subject: 'Computer science', expectedConcepts: ['query plan'], reasoning: 'Assess debugging.' };
const session = { interviewType: 'core_cse', totalQuestions: 3, currentQuestionIndex: 0, maxCrossQuestions: 0, crossQuestionCount: 0, askedQuestions: [], askedTopics: [], difficulty: 'medium' };
const success = (value) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] }) });
const failure = (status) => ({ ok: false, status, headers: { get: () => null }, text: async () => '{}' });

test.beforeEach((t) => {
  const oldEnv = { ...env };
  const originalFetch = globalThis.fetch;
  Object.assign(env, { mockAi: false, geminiApiKey: 'fake-test-key', geminiModel: 'test-primary', aiProvider: 'gemini', aiModelFallbacks: [], allowLocalAiFallback: true });
  resetGeminiCooldowns();
  t.after(() => { Object.assign(env, oldEnv); globalThis.fetch = originalFetch; resetGeminiCooldowns(); });
});

test('temporary 503 is retried and recovers', async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? failure(503) : success(first);
  assert.ok(await generateGeminiJson('question'));
  assert.equal(calls, 2);
});

test('429 opens cooldown, avoids repeated quota requests, and uses practice mode', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return failure(429); };
  const one = await aiInterviewService.generateFirstQuestion(session, []);
  const two = await aiInterviewService.generateFirstQuestion(session, []);
  assert.equal(one.generationMode, 'practice');
  assert.equal(two.fallbackReason, 'llm_quota_exceeded');
  assert.equal(calls, 1);
});

test('bad credentials are not retried and raw provider details are not returned', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return { ...failure(403), text: async () => '{"error":{"message":"secret-credential"}}' }; };
  await assert.rejects(generateGeminiJson('question'), (error) => error.details.status === 403 && !error.message.includes('secret-credential'));
  assert.equal(calls, 1);
});

test('a hung request is aborted within the shared deadline', async () => {
  let aborted = false;
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }));
  await assert.rejects(generateGeminiJson('question', { deadline: Date.now() + 30 }), (error) => error.statusCode === 504);
  assert.equal(aborted, true);
});

test('syntactically valid JSON with invalid fields uses local fallback', async () => {
  globalThis.fetch = async () => success({ questionText: 77 });
  const value = await aiInterviewService.generateFirstQuestion(session, []);
  assert.equal(value.generationMode, 'practice');
  assert.equal(typeof value.questionText, 'string');
});

test('structured output contract is sent and a valid response stays in AI mode', async () => {
  let body;
  globalThis.fetch = async (_url, options) => { body = JSON.parse(options.body); return success(first); };
  const value = await aiInterviewService.generateFirstQuestion(session, []);
  assert.equal(value.generationMode, 'ai');
  assert.ok(body.generationConfig.responseJsonSchema.required.includes('questionText'));
  assert.equal(outputSchema('answer').properties.answerEvaluation.properties.score.type, 'number');
});

test('configured fallback model is used for an unavailable primary', async () => {
  env.aiModelFallbacks = ['gemini:test-fallback'];
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(url); return urls.length === 1 ? failure(404) : success(first); };
  const result = await aiInterviewService.generateFirstQuestion(session, []);
  assert.equal(result.generationMode, 'ai');
  assert.ok(urls[1].includes('test-fallback'));
});

test('server prevents model from exceeding the follow-up cap or ending early', async () => {
  const answerEvaluation = { score: 7, strengths: ['Relevant example'], gaps: ['No edge case'], brief: 'Good reasoning.' };
  for (const [decision, questionType] of [['ASK_FOLLOWUP', 'followup'], ['END_INTERVIEW', 'closing']]) {
    globalThis.fetch = async () => success({ ...first, decision, questionType, answerEvaluation });
    const result = await aiInterviewService.processAnswer(session, [], first, 'I would inspect the database query plan.');
    assert.equal(result.decision, 'NEXT_QUESTION');
    assert.equal(result.questionType, 'main');
    assert.equal(result.answerEvaluation.score, 7);
  }
});

test('server ends at the main question limit regardless of model decision', async () => {
  globalThis.fetch = async () => success({ ...first, decision: 'NEXT_QUESTION', answerEvaluation: { score: 7, strengths: [], gaps: [], brief: 'Good reasoning.' } });
  const result = await aiInterviewService.processAnswer({ ...session, totalQuestions: 1 }, [], first, 'I would inspect the database query plan.');
  assert.equal(result.decision, 'END_INTERVIEW');
  assert.equal(result.questionText, null);
});

test('schema rejects contradictory decisions and out-of-range scores', () => {
  assert.equal(interviewOutputs.answer.safeParse({ ...first, decision: 'ASK_FOLLOWUP', answerEvaluation: { score: 17, strengths: [], gaps: [], brief: 'Incorrect.' } }).success, false);
});

test('expected concepts are not credited unless the answer mentions them', () => {
  const extraction = KeywordExtractionService.extract('I used MongoDB collections for users and orders with embedded items and references.', { expectedConcepts: ['transactions', 'indexes'] });
  assert.equal(extraction.skills.includes('transactions'), false);
  assert.equal(extraction.skills.includes('indexes'), false);
  assert.equal(extraction.isVague, false);
});

test('a failed final evaluation still produces a labeled report when fallback is disabled', async () => {
  env.allowLocalAiFallback = false;
  globalThis.fetch = async () => failure(403);
  const value = await aiInterviewService.generateFinalEvaluation({ ...session, evaluationNotes: [] });
  assert.equal(value.evaluationSource, 'heuristic');
  assert.ok(value.summary);
});

test('offline scenarios supply a concrete task and probes use actual answer evidence', () => {
  assert.match(practiceScenario('Sliding Window', 'intermediate').questionText, /abba/);
  assert.match(technicalAnswerProbe('I chose round robin to schedule tasks.', 'Process Scheduling').questionText, /time quantum/);
  assert.equal(technicalAnswerProbe('I am not sure about this.', 'Process Scheduling'), null);
  assert.equal(technicalAnswerProbe('I chose round robin.', 'Process Scheduling', 2), null);
});

test('an unanswered session does not receive an invented readiness score', () => {
  const report = interviewReportService.buildReport({ ...session, questionHistory: [first], evaluationNotes: [] });
  assert.equal(report.finalScore, 0);
  assert.deepEqual(report.skillBreakdown, []);
});

test('tests never send OTP emails even with SMTP credentials configured', async (t) => {
  env.nodeEnv = 'test';
  env.smtp = { host: 'smtp.example.test', user: 'test', pass: 'test', from: 'test@example.test' };
  const original = nodemailer.createTransport;
  let calls = 0;
  nodemailer.createTransport = () => { calls += 1; throw new Error('Must not create a real mail transport during tests'); };
  t.after(() => { nodemailer.createTransport = original; });
  await sendOtpEmail({ to: 'test@example.test', otp: '123456' });
  assert.equal(calls, 0);
});
