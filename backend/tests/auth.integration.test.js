import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'auth-test-secret';
process.env.REFRESH_TOKEN_SECRET = 'auth-test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1s';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

const [{ default: bcrypt }, { createApp }, { ROLES }, { memoryStore }] = await Promise.all([
  import('bcryptjs'),
  import('../src/app.js'),
  import('../src/constants/roles.js'),
  import('../src/utils/memoryStore.js'),
]);

function resetUsers() {
  memoryStore.users.length = 0;
}

function createServer() {
  const app = createApp();
  return app.listen(0);
}

function baseUrl(server) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}/api/v1`;
}

function cookieHeader(response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

async function request(server, path, options = {}) {
  const response = await fetch(`${baseUrl(server)}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

async function seedVerifiedUser(overrides = {}) {
  const password = overrides.password || 'password123';
  const user = {
    id: overrides.id || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: overrides.name || 'Candidate User',
    email: (overrides.email || 'candidate@example.com').toLowerCase(),
    password: await bcrypt.hash(password, 12),
    role: overrides.role || ROLES.CANDIDATE,
    isVerified: overrides.isVerified ?? true,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.users.push(user);
  return { user, password };
}

test('register creates a pending account and prevents duplicate verified accounts', async (t) => {
  resetUsers();
  const server = createServer();
  t.after(() => server.close());

  const { response, body } = await request(server, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'New Candidate',
      email: 'new@example.com',
      password: 'password123',
    }),
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(memoryStore.users.length, 1);
  assert.equal(memoryStore.users[0].isVerified, false);
  assert.ok(memoryStore.users[0].password);

  memoryStore.users[0].isVerified = true;
  const duplicate = await request(server, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'New Candidate',
      email: 'new@example.com',
      password: 'password123',
    }),
  });

  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.message, 'Email is already registered');
});

test('login returns user, access token, csrf token, and secure refresh cookie', async (t) => {
  resetUsers();
  const server = createServer();
  t.after(() => server.close());
  const { password } = await seedVerifiedUser({ email: 'login@example.com' });

  const { response, body } = await request(server, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'login@example.com', password, rememberMe: true }),
  });

  assert.equal(response.status, 200);
  assert.equal(body.data.user.email, 'login@example.com');
  assert.ok(body.data.token);
  assert.ok(body.data.csrfToken);
  assert.match(response.headers.getSetCookie().join('\n'), /interviewai_refresh=.*HttpOnly/);
});

test('login rejects invalid credentials and unverified accounts', async (t) => {
  resetUsers();
  const server = createServer();
  t.after(() => server.close());
  const { password } = await seedVerifiedUser({ email: 'invalid@example.com' });

  const invalid = await request(server, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid@example.com', password: 'wrong-password' }),
  });
  assert.equal(invalid.response.status, 401);
  assert.equal(invalid.body.message, 'Invalid email or password');

  memoryStore.users[0].isVerified = false;
  const unverified = await request(server, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid@example.com', password }),
  });
  assert.equal(unverified.response.status, 403);
  assert.equal(unverified.body.message, 'Please verify your email before signing in');
});

test('refresh token persists sessions and rotates access credentials', async (t) => {
  resetUsers();
  const server = createServer();
  t.after(() => server.close());
  const { password } = await seedVerifiedUser({ email: 'persist@example.com' });

  const login = await request(server, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'persist@example.com', password, rememberMe: true }),
  });
  const cookies = cookieHeader(login.response);

  const refresh = await request(server, '/auth/refresh-token', {
    method: 'POST',
    headers: {
      Cookie: cookies,
      'x-csrf-token': login.body.data.csrfToken,
    },
  });

  assert.equal(refresh.response.status, 200);
  assert.equal(refresh.body.data.user.email, 'persist@example.com');
  assert.ok(refresh.body.data.token);
  assert.notEqual(refresh.body.data.csrfToken, login.body.data.csrfToken);
});

test('logout revokes refresh token and clears session cookies', async (t) => {
  resetUsers();
  const server = createServer();
  t.after(() => server.close());
  const { password } = await seedVerifiedUser({ email: 'logout@example.com' });

  const login = await request(server, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'logout@example.com', password }),
  });
  const cookies = cookieHeader(login.response);

  const logout = await request(server, '/auth/logout', {
    method: 'POST',
    headers: {
      Cookie: cookies,
      'x-csrf-token': login.body.data.csrfToken,
    },
  });

  assert.equal(logout.response.status, 200);
  assert.equal(memoryStore.users[0].refreshTokenHash, null);
  assert.match(logout.response.headers.getSetCookie().join('\n'), /interviewai_refresh=;/);

  const refresh = await request(server, '/auth/refresh-token', {
    method: 'POST',
    headers: {
      Cookie: cookies,
      'x-csrf-token': login.body.data.csrfToken,
    },
  });
  assert.equal(refresh.response.status, 401);
});
