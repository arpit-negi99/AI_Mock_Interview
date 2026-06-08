import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const interviewService = {
  configure: (payload) => apiClient.post(API_ENDPOINTS.INTERVIEWS.CONFIGURE, payload),
  getSessions: (params) => apiClient.get(API_ENDPOINTS.INTERVIEWS.SESSIONS, { params }),
  submitResponse: (payload) => apiClient.post(API_ENDPOINTS.INTERVIEWS.SUBMIT_RESPONSE, payload),
};
