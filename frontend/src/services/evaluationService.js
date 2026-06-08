import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const evaluationService = {
  getResult: (id) => apiClient.get(`${API_ENDPOINTS.EVALUATIONS.BASE}/${id}`),
  getReports: (params) => apiClient.get(API_ENDPOINTS.EVALUATIONS.REPORTS, { params }),
};
