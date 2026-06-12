import { interviewSessionService } from '../../services/interviewSession.service.js';
import { logger } from '../../config/logger.js';

export function registerInterviewSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('interview:start', async ({ sessionId }) => {
      try {
        if (!socket.user) throw new Error('Socket authentication required');
        if (sessionId) await interviewSessionService.ensureOwnSession(sessionId, socket.user);
        if (sessionId) socket.join(`session:${sessionId}`);
        socket.emit('interview:thinking', { state: 'ready', sessionId });
      } catch (error) {
        socket.emit('interview:error', { message: error.message });
      }
    });

    socket.on('candidate:text-answer', async ({ sessionId, transcript }) => {
      try {
        if (!socket.user) throw new Error('Socket authentication required');
        await interviewSessionService.ensureOwnSession(sessionId, socket.user);
        socket.join(`session:${sessionId}`);
        socket.emit('interview:thinking', { state: 'processing' });
        const result = await interviewSessionService.processCandidateAnswer({
          sessionId,
          user: socket.user,
          transcript,
        });
        const event = result.ended ? 'interview:ended' : result.questionType === 'followup' ? 'interview:followup' : result.questionType === 'clarification' ? 'interview:clarification' : 'interview:question';
        socket.emit(event, result);
        if (result.ended && result.finalEvaluation) socket.emit('interview:evaluation-ready', { sessionId, finalEvaluation: result.finalEvaluation });
      } catch (error) {
        logger.error('Socket text answer failed', { error: error.message });
        socket.emit('interview:error', { message: error.message });
      }
    });

    socket.on('candidate:audio-answer', () => {
      socket.emit('interview:error', { message: 'Send audio through the HTTP upload endpoint in mock mode.' });
    });

    socket.on('interview:next-question', ({ sessionId }) => {
      socket.emit('interview:thinking', { state: 'generating', sessionId });
    });

    socket.on('interview:end', async ({ sessionId }) => {
      try {
        if (!socket.user) throw new Error('Socket authentication required');
        await interviewSessionService.ensureOwnSession(sessionId, socket.user);
        socket.to(`session:${sessionId}`).emit('interview:ended', { sessionId });
      } catch (error) {
        socket.emit('interview:error', { message: error.message });
      }
    });
  });
}
