import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const userService = {
  getProfile: () => apiClient.get(API_ENDPOINTS.USERS.PROFILE),
  updateProfile: (payload) => apiClient.put(API_ENDPOINTS.USERS.PROFILE, payload),
  getProgress: (params) => apiClient.get(API_ENDPOINTS.USERS.PROGRESS, { params }),
  deleteAccount: () => apiClient.delete(API_ENDPOINTS.USERS.ACCOUNT),
};
