import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const questionService = {
  list: (params) => apiClient.get(API_ENDPOINTS.QUESTIONS.BASE, { params }),
  getBank: (params) => apiClient.get(API_ENDPOINTS.QUESTIONS.BANK, { params }),
  create: (payload) => apiClient.post(API_ENDPOINTS.QUESTIONS.BASE, payload),
  update: (id, payload) => apiClient.put(`${API_ENDPOINTS.QUESTIONS.BASE}/${id}`, payload),
};
