import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { initSocket } from '../src/config/socket.js';
import { memoryStore } from '../src/utils/memoryStore.js';
import { generateToken } from '../src/utils/generateToken.js';

test('HTTP interview flow accepts typed answers, rejects stale turns, and returns a report', async (t) => {
  const server = createServer(createApp());
  const io = initSocket(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { io.close(); server.closeAllConnections(); server.close(); });
  const user = { id: 'http-candidate', email: 'http@example.test', role: 'candidate', isVerified: true, isActive: true };
  memoryStore.users.push(user);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${generateToken(user)}` };
  const request = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, { headers, method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const started = await request('/interviews/start', { interviewType: 'core_cse', totalQuestions: 2, maxCrossQuestions: 0 });
  assert.equal(started.status, 201);
  const id = started.body.data.session.id;
  const transcript = 'I would compare the alternatives and inspect their time complexity with realistic examples.';
  const first = await request(`/voice/session/${id}/answer`, { transcript, expectedQuestionCount: 1 });
  assert.equal(first.status, 200);
  assert.equal(first.body.data.session.questionHistory.length, 2);
  const stale = await request(`/voice/session/${id}/answer`, { transcript, expectedQuestionCount: 1 });
  assert.equal(stale.status, 409);
  const last = await request(`/voice/session/${id}/answer`, { transcript, expectedQuestionCount: 2 });
  assert.equal(last.status, 200);
  assert.equal(last.body.data.ended, true);
  assert.equal(last.body.data.session.evaluationNotes.length, 2);
  assert.equal(last.body.data.session.evaluationNotes[0].source, 'heuristic');
  assert.ok(last.body.data.interviewReport);
  const restored = await request(`/interviews/${id}`);
  assert.equal(restored.body.data.storageMode, 'memory');
  assert.equal(restored.body.data.session.status, 'completed');
});
