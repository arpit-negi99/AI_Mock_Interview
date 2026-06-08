import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const notificationService = {
  list: (params) => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params }),
  markRead: (id) => apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}/read`),
};
