import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { ROLES } from '@/constants/roles';
import { apiClient } from './apiClient';

export const authService = {
  login: (payload) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload),
  register: (payload) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload),
  verifyRegistration: (payload) => apiClient.post(API_ENDPOINTS.AUTH.VERIFY_REGISTRATION, payload),
  refresh: () => apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN),
  forgotPassword: (payload) => apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload),
  resetPassword: (payload) => apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload),
  logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  me: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
};

export function unwrapAuthSession(response) {
  if (response?.token && response?.user) return response;
  if (response?.data?.token && response?.data?.user) return response.data;
  return response;
}

export function createMockSession(email) {
  const isAdmin = email?.toLowerCase().includes('admin');
  return {
    token: `mock-token-${Date.now()}`,
    user: {
      id: isAdmin ? 'admin-001' : 'candidate-001',
      name: isAdmin ? 'Admin User' : 'Candidate User',
      email,
      role: isAdmin ? ROLES.ADMIN : ROLES.CANDIDATE,
    },
  };
}
