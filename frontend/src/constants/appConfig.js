export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'InterviewAI',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? `${window.location.origin}/api/v1` : 'http://localhost:5000/api/v1'),
  socketUrl: import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'),
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
  pageSize: 10,
  storageKeys: {
    token: 'interviewai_token',
    user: 'interviewai_user',
    csrfToken: 'interviewai_csrf_token',
    rememberMe: 'interviewai_remember_me',
  },
};
