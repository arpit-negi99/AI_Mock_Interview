export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_REGISTRATION: '/auth/verify-registration',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    ACCOUNT: '/users/account',
    PROGRESS: '/users/progress',
  },
  INTERVIEWS: {
    CONFIGURE: '/interviews/configure',
    SESSIONS: '/interviews/sessions',
    SUBMIT_RESPONSE: '/interviews/responses',
  },
  QUESTIONS: {
    BASE: '/questions',
    BANK: '/questions/bank',
  },
  EVALUATIONS: {
    BASE: '/evaluations',
    REPORTS: '/evaluations/reports',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    RUBRICS: '/admin/rubrics',
    REPORTS: '/admin/reports',
    AUDIT_LOGS: '/admin/audit-logs',
  },
};
