import { getIo } from '../config/socket.js';

export function emitToSession(sessionId, event, payload) {
  getIo().to(`session:${sessionId}`).emit(event, payload);
}
