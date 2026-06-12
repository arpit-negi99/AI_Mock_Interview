import http from 'node:http';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './config/socket.js';
import { registerInterviewSocketHandlers } from './modules/voiceSession/voice.socket.js';
import { syllabusRepository } from './modules/syllabus/syllabus.repository.js';

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);
registerInterviewSocketHandlers(io);

await connectDb();
await syllabusRepository.seedSamples();

server.listen(env.port, () => {
  logger.info(`Backend listening on http://localhost:${env.port}${env.apiPrefix}`);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error: error.message });
});
