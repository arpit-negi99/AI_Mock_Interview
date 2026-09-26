import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';

process.env.NODE_ENV = 'test';
const { env } = await import('../src/config/env.js');
const { default: mongoose } = await import('mongoose');
const { createApp } = await import('../src/app.js');
const { validateProductionConfig, frontendDist } = await import('../src/config/production.js');
const { connectDb, isDbConnected } = await import('../src/config/db.js');
const { memoryStore } = await import('../src/utils/memoryStore.js');
const { userRepository } = await import('../src/modules/auth/auth.repository.js');
const { sendBrevoEmail } = await import('../src/services/emailTransport.service.js');
const { sendOtpEmail } = await import('../src/services/email.service.js');

function configure(t, values) {
  const old = { ...env };
  Object.assign(env, values);
  t.after(() => Object.assign(env, old));
}
function connection(t, state) {
  const old = mongoose.connection._readyState;
  mongoose.connection._readyState = state;
  t.after(() => { mongoose.connection._readyState = old; });
}
async function serve(t) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}
const emailConfig = { brevoApiKey: 'private-test-key', emailFrom: 'sender@example.test', emailFromName: 'InterviewAI', emailTimeoutMs: 1000 };

test('Brevo uses HTTPS and the API key header with both OTP representations', async () => {
  const calls = [];
  await sendBrevoEmail({ to: 'candidate@example.test', subject: 'Verify', text: 'OTP: 123456', html: '<p>123456</p>' }, emailConfig, async (...args) => {
    calls.push(args);
    return new Response('{"messageId":"test"}', { status: 201 });
  });
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(options.headers['api-key'], emailConfig.brevoApiKey);
  assert.ok(options.signal instanceof AbortSignal);
  const body = JSON.parse(options.body);
  assert.equal(body.sender.email, emailConfig.emailFrom);
  assert.equal(body.to[0].email, 'candidate@example.test');
  assert.match(body.textContent, /123456/);
  assert.match(body.htmlContent, /123456/);
});

test('Brevo errors and ambiguous timeouts are bounded, redacted, and not retried', async () => {
  for (const status of [401, 429, 500]) {
    let calls = 0;
    await assert.rejects(sendBrevoEmail({}, emailConfig, async () => {
      calls++;
      return new Response('private-test-key provider-secret', { status });
    }), (error) => {
      assert.equal(error.statusCode, status === 429 ? 503 : 502);
      assert.doesNotMatch(error.message, /provider-secret|private-test-key/);
      return true;
    });
    assert.equal(calls, 1);
  }
  await assert.rejects(sendBrevoEmail({}, emailConfig, async () => { throw new DOMException('secret URL', 'TimeoutError'); }), /could not be confirmed/);
  await assert.rejects(sendBrevoEmail({}, { ...emailConfig, brevoApiKey: '' }, () => assert.fail('must not send')), /not configured/);
});

test('both OTP purposes use Brevo and escape user-supplied names', async (t) => {
  configure(t, { ...emailConfig, nodeEnv: 'production', emailProvider: 'brevo' });
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return new Response('{}', { status: 201 });
  });
  for (const purpose of ['register', 'reset-password']) {
    await sendOtpEmail({ to: 'recipient@example.test', name: '<script>bad()</script>', otp: '654321', purpose, expiresInMinutes: 10 });
  }
  assert.match(sent[0].subject, /Verify/);
  assert.match(sent[1].subject, /Reset/);
  assert.ok(sent.every((email) => !email.htmlContent.includes('<script>') && email.htmlContent.includes('&lt;script&gt;')));
});

test('production validates secrets, origins, database and email before startup', () => {
  const config = { ...env, ...emailConfig, isProduction: true, mongoUri: 'mongodb://localhost/test', jwtSecret: 'a'.repeat(48), refreshTokenSecret: 'b'.repeat(48), clientOrigins: ['https://app.onrender.com'], trustProxyHops: 1, emailProvider: 'brevo' };
  assert.doesNotThrow(() => validateProductionConfig(config));
  for (const patch of [{ mongoUri: '' }, { jwtSecret: 'short' }, { refreshTokenSecret: config.jwtSecret }, { clientOrigins: ['http://localhost:5173'] }, { clientOrigins: ['https://app.onrender.com/path'] }, { brevoApiKey: '' }, { emailFrom: '' }, { trustProxyHops: -1 }]) {
    assert.throws(() => validateProductionConfig({ ...config, ...patch }), /Production configuration/);
  }
});

test('production never falls back to temporary users on startup or disconnect', async (t) => {
  configure(t, { isProduction: true, mongoUri: '' });
  connection(t, 0);
  await assert.rejects(connectDb(), /required in production/);
  assert.throws(isDbConnected, (error) => error.statusCode === 503);
  const before = memoryStore.users.length;
  await assert.rejects(userRepository.create({ email: 'temporary@example.test' }), (error) => error.statusCode === 503);
  assert.equal(memoryStore.users.length, before);
  Object.assign(env, { mongoUri: 'mongodb://localhost/test', mongoConnectRetries: 1 });
  t.mock.method(mongoose, 'connect', async () => { throw new Error('private URI'); });
  t.mock.method(mongoose, 'disconnect', async () => {});
  await assert.rejects(connectDb(), /Production startup stopped/);
});

test('readiness and API requests track MongoDB availability without consuming health rate limits', async (t) => {
  configure(t, { isProduction: true, trustProxyHops: 1 });
  connection(t, 0);
  const base = await serve(t);
  assert.equal((await fetch(`${base}/api/v1/health/ready`)).status, 503);
  assert.equal((await fetch(`${base}/api/v1/auth/me`)).status, 503);
  mongoose.connection._readyState = 1;
  const ready = await fetch(`${base}/api/v1/health/ready`);
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get('ratelimit-limit'), null);
  assert.equal((await fetch(`${base}/api/v1/auth/me`)).status, 401);
});

test('production build serves deep links, caches assets, and keeps API/file 404s out of the SPA', async (t) => {
  try { await fs.access(path.join(frontendDist, 'index.html')); }
  catch { t.skip('Build the frontend to run the production serving check'); return; }
  configure(t, { serveFrontend: true, isProduction: true });
  connection(t, 1);
  const base = await serve(t);
  for (const route of ['/', '/login', '/interview/session']) {
    const response = await fetch(`${base}${route}`, { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /id="root"/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
  }
  const html = await fs.readFile(path.join(frontendDist, 'index.html'), 'utf8');
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)[1];
  const response = await fetch(`${base}${asset}`);
  assert.match(response.headers.get('cache-control'), /immutable/);
  assert.equal(response.headers.get('ratelimit-limit'), null);
  assert.doesNotMatch(await response.text(), /http:\/\/localhost:5000/);
  for (const route of ['/api/v1/no-such-endpoint', '/assets/missing.js', '/uploads/resumes/private.pdf']) {
    assert.equal((await fetch(`${base}${route}`)).status, 404);
  }
});

test('public registration cannot create an administrator account', async (t) => {
  const base = await serve(t);
  const response = await fetch(`${base}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker', email: 'attacker@example.test', password: 'password123', role: 'admin' }),
  });
  assert.equal(response.status, 422);
});
