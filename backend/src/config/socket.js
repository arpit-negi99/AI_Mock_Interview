import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { logger } from './logger.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      socket.user = jwt.verify(token, env.jwtSecret);
      return next();
    } catch {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.id });
    socket.on('disconnect', () => logger.info('Socket disconnected', { socketId: socket.id }));
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
}
