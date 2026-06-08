import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { apiClient } from './apiClient';

export const adminService = {
  getDashboard: () => apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD),
  getRubrics: (params) => apiClient.get(API_ENDPOINTS.ADMIN.RUBRICS, { params }),
  saveRubric: (payload) => apiClient.post(API_ENDPOINTS.ADMIN.RUBRICS, payload),
  getReports: (params) => apiClient.get(API_ENDPOINTS.ADMIN.REPORTS, { params }),
  getAuditLogs: (params) => apiClient.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params }),
};
