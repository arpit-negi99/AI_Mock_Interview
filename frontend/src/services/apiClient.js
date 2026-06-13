import axios from 'axios';
import { APP_CONFIG } from '@/constants/appConfig';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

export function getStoredAccessToken() {
  return localStorage.getItem(APP_CONFIG.storageKeys.token)
    || sessionStorage.getItem(APP_CONFIG.storageKeys.token);
}

export function getStoredCsrfToken() {
  return localStorage.getItem(APP_CONFIG.storageKeys.csrfToken)
    || sessionStorage.getItem(APP_CONFIG.storageKeys.csrfToken)
    || readCookie('interviewai_csrf');
}

export function persistAuthSession(session, rememberMe = true) {
  const primary = rememberMe ? localStorage : sessionStorage;
  const secondary = rememberMe ? sessionStorage : localStorage;

  primary.setItem(APP_CONFIG.storageKeys.token, session.token);
  primary.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(session.user));
  primary.setItem(APP_CONFIG.storageKeys.csrfToken, session.csrfToken || '');
  primary.setItem(APP_CONFIG.storageKeys.rememberMe, String(rememberMe));

  secondary.removeItem(APP_CONFIG.storageKeys.token);
  secondary.removeItem(APP_CONFIG.storageKeys.user);
  secondary.removeItem(APP_CONFIG.storageKeys.csrfToken);
  secondary.removeItem(APP_CONFIG.storageKeys.rememberMe);
}

export function clearStoredAuthSession() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(APP_CONFIG.storageKeys.token);
    storage.removeItem(APP_CONFIG.storageKeys.user);
    storage.removeItem(APP_CONFIG.storageKeys.csrfToken);
    storage.removeItem(APP_CONFIG.storageKeys.rememberMe);
  });
}

async function refreshAuthSession() {
  const response = await axios.post(
    `${APP_CONFIG.apiBaseUrl}/auth/refresh-token`,
    null,
    {
      withCredentials: true,
      headers: { 'x-csrf-token': getStoredCsrfToken() || '' },
    },
  );
  const session = response.data?.data;
  if (!session?.token || !session?.user) {
    throw new ApiError('Unable to refresh session.', 401, response.data);
  }

  const rememberMe = localStorage.getItem(APP_CONFIG.storageKeys.rememberMe) !== null;
  persistAuthSession(session, rememberMe);
  return session;
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrfToken = getStoredCsrfToken();
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRefresh = originalRequest?.url?.includes('/auth/refresh-token');
    const canRefresh = error.response?.status === 401 && !originalRequest?._retry && !isAuthRefresh;

    if (canRefresh) {
      originalRequest._retry = true;
      try {
        const session = await refreshAuthSession();
        originalRequest.headers.Authorization = `Bearer ${session.token}`;
        originalRequest.headers['x-csrf-token'] = session.csrfToken || getStoredCsrfToken() || '';
        return apiClient(originalRequest);
      } catch {
        clearStoredAuthSession();
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export function normalizeApiError(error) {
  if (!error.response) {
    return new ApiError('Network error. Please check your connection and retry.', 0, error);
  }

  const { status, data } = error.response;
  return new ApiError(data?.message || data?.error || getStatusMessage(status), status, data);
}

export function getStatusMessage(status) {
  const messages = {
    400: 'The submitted data is invalid.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This record conflicts with an existing resource.',
    422: 'Please review the highlighted fields.',
    429: 'Too many requests. Please wait and try again.',
    500: 'The server could not complete the request.',
  };
  return messages[status] || 'Something went wrong. Please try again.';
}
