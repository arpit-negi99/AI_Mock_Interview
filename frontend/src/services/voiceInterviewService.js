import { apiClient } from './apiClient';

export const voiceInterviewService = {
  start: (payload) => apiClient.post('/interviews/start', payload),
  getSession: (sessionId) => apiClient.get(`/interviews/${sessionId}`),
  end: (sessionId) => apiClient.post(`/interviews/${sessionId}/end`),
  answerText: (sessionId, transcript) => apiClient.post(`/voice/session/${sessionId}/answer`, { transcript }),
  transcribe: (sessionId, formData) => apiClient.post(`/voice/session/${sessionId}/transcribe`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  speak: (sessionId, text) => apiClient.post(`/voice/session/${sessionId}/speak`, { text }),
};
