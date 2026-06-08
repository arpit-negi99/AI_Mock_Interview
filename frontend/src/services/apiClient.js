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
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(APP_CONFIG.storageKeys.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(normalizeApiError(error)),
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
