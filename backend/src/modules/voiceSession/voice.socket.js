import { interviewSessionService } from '../../services/interviewSession.service.js';
import { logger } from '../../config/logger.js';

export function registerInterviewSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('interview:start', async ({ sessionId }) => {
      if (sessionId) socket.join(`session:${sessionId}`);
      socket.emit('interview:processing', { state: 'ready', sessionId });
    });

    socket.on('candidate:text-answer', async ({ sessionId, transcript }) => {
      try {
        if (!socket.user) throw new Error('Socket authentication required');
        socket.join(`session:${sessionId}`);
        socket.emit('interview:processing', { state: 'processing' });
        const result = await interviewSessionService.processCandidateAnswer({
          sessionId,
          user: socket.user,
          transcript,
        });
        socket.emit(result.ended ? 'interview:ended' : 'ai:question', result);
      } catch (error) {
        logger.error('Socket text answer failed', { error: error.message });
        socket.emit('interview:error', { message: error.message });
      }
    });

    socket.on('candidate:audio-answer', () => {
      socket.emit('interview:error', { message: 'Send audio through the HTTP upload endpoint in mock mode.' });
    });

    socket.on('interview:next-question', ({ sessionId }) => {
      socket.emit('interview:processing', { state: 'generating', sessionId });
    });

    socket.on('interview:end', async ({ sessionId }) => {
      socket.to(`session:${sessionId}`).emit('interview:ended', { sessionId });
    });
  });
}
