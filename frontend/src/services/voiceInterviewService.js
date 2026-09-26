import { apiClient } from './apiClient';

export const voiceInterviewService = {
  start: (payload) => apiClient.post('/interviews/start', payload, { timeout: 60000 }),
  getSession: (sessionId) => apiClient.get(`/interviews/${sessionId}`),
  end: (sessionId) => apiClient.post(`/interviews/${sessionId}/end`, {}, { timeout: 60000 }),
  answerText: (sessionId, transcript, expectedQuestionCount) => apiClient.post(`/voice/session/${sessionId}/answer`, { transcript, expectedQuestionCount }, { timeout: 60000 }),
  answerAudio: (sessionId, formData) => apiClient.post(`/voice/session/${sessionId}/answer`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  transcribe: (sessionId, formData) => apiClient.post(`/voice/session/${sessionId}/transcribe`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  speak: (sessionId, text) => apiClient.post(`/voice/session/${sessionId}/speak`, { text }),
};
