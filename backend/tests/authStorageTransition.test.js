import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'storage-transition-test-secret';
process.env.REFRESH_TOKEN_SECRET = 'storage-transition-refresh-secret';

const { default: mongoose } = await import('mongoose');
const { userRepository } = await import('../src/modules/auth/auth.repository.js');
const { User } = await import('../src/modules/auth/user.model.js');
const { createApp } = await import('../src/app.js');
const { generateToken, generateRefreshToken } = await import('../src/utils/generateToken.js');
const { memoryStore } = await import('../src/utils/memoryStore.js');
const { default: bcrypt } = await import('bcryptjs');

function mockConnectionState(t, value) {
  const previous = mongoose.connection._readyState;
  mongoose.connection._readyState = value;
  t.after(() => { mongoose.connection._readyState = previous; });
}

test('MongoDB rejects temporary and malformed user IDs without issuing queries', async (t) => {
  mockConnectionState(t, 1);
  const failQuery = () => { throw new Error('Invalid ID must never reach MongoDB'); };
  t.mock.method(User, 'findById', failQuery);
  t.mock.method(User, 'findByIdAndUpdate', failQuery);
  t.mock.method(User, 'findByIdAndDelete', failQuery);
  for (const id of ['user_1790439029388', 'not-an-id', '', undefined, null, 123, { $ne: null }]) {
    assert.equal(await userRepository.findById(id), null);
    assert.equal(await userRepository.updateById(id, { name: 'Test' }), null);
    assert.equal(await userRepository.deleteById(id), null);
  }
});

test('valid MongoDB IDs still query users and preserve session-field selection', async (t) => {
  mockConnectionState(t, 1);
  const id = new mongoose.Types.ObjectId();
  const selected = [];
  const query = { select: (fields) => { selected.push(fields); return query; } };
  const lookup = t.mock.method(User, 'findById', () => query);
  assert.equal(await userRepository.findById(id, true), query);
  assert.equal(await userRepository.findById(id.toHexString()), query);
  assert.equal(lookup.mock.callCount(), 2);
  assert.match(selected[0], /refreshTokenHash/);
});

test('temporary users remain usable while the temporary store is active', async (t) => {
  mockConnectionState(t, 0);
  const user = { id: 'user_transition_test', name: 'Temporary user' };
  memoryStore.users.push(user);
  t.after(() => { memoryStore.users.splice(memoryStore.users.indexOf(user), 1); });
  assert.equal(await userRepository.findById(user.id), user);
});

test('stale access and refresh tokens return 401 after switching to MongoDB', async (t) => {
  mockConnectionState(t, 1);
  const lookup = t.mock.method(User, 'findById', () => { throw new Error('Must reject before querying'); });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const user = { id: 'user_1790439029388', role: 'candidate', email: 'transition@example.test' };
  const base = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
  const me = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${generateToken(user, '10m')}` } });
  assert.equal(me.status, 401);
  assert.doesNotMatch((await me.json()).message, /Cast|ObjectId/);
  const refresh = await fetch(`${base}/refresh-token`, { method: 'POST', headers: { Cookie: `interviewai_refresh=${generateRefreshToken(user)}` } });
  assert.equal(refresh.status, 401);
  assert.equal(lookup.mock.callCount(), 0);
});

test('password reset accepts a valid code, changes the password, and consumes the code', async (t) => {
  mockConnectionState(t, 0);
  const user = {
    id: 'reset-test-user', email: 'reset@example.test', name: 'Reset Test', role: 'candidate', isActive: true, isVerified: true,
    password: await bcrypt.hash('old-password', 4), otpHash: await bcrypt.hash('123456', 4),
    otpPurpose: 'reset-password', otpExpiresAt: new Date(Date.now() + 60000), refreshTokenHash: 'old-session',
  };
  memoryStore.users.push(user);
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); memoryStore.users.length = 0; });
  const post = async (path, data) => fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const invalid = await post('/reset-password', { email: user.email, otp: '654321', password: 'new-password' });
  assert.equal(invalid.status, 400);
  const reset = await post('/reset-password', { email: ' RESET@EXAMPLE.TEST ', otp: '123456', password: 'new-password' });
  assert.equal(reset.status, 200);
  const updated = await userRepository.findById(user.id);
  assert.equal(updated.otpHash, null);
  assert.equal(updated.refreshTokenHash, null);
  assert.equal(await bcrypt.compare('new-password', updated.password), true);
  assert.equal((await post('/login', { email: user.email, password: 'old-password' })).status, 401);
  assert.equal((await post('/login', { email: ' RESET@EXAMPLE.TEST ', password: 'new-password' })).status, 200);
  assert.equal((await post('/reset-password', { email: user.email, otp: '123456', password: 'third-password' })).status, 400);
});

test('forgot-password gives the same conditional response for existing and missing accounts', async (t) => {
  mockConnectionState(t, 0);
  memoryStore.users.push({ id: 'forgot-test-user', name: 'Forgot Test', email: 'forgot@example.test', isActive: true });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); memoryStore.users.length = 0; });
  const post = async (email) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.deepEqual(await post('forgot@example.test'), await post('missing@example.test'));
  assert.equal((await userRepository.findById('forgot-test-user')).otpPurpose, 'reset-password');
});
