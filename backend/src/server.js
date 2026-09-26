import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './config/socket.js';
import { registerInterviewSocketHandlers } from './modules/voiceSession/voice.socket.js';
import { syllabusRepository } from './modules/syllabus/syllabus.repository.js';
import { validateProductionConfig, assertFrontendBuild } from './config/production.js';

validateProductionConfig(env);
assertFrontendBuild(env);

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);
registerInterviewSocketHandlers(io);

await connectDb();
// Create declared indexes without dropping any existing indexes.
if (env.isProduction) {
  for (const model of Object.values(mongoose.models)) await model.createIndexes();
}
await syllabusRepository.seedSamples();

server.listen(env.port, '0.0.0.0', () => {
  logger.info(`Backend listening on http://localhost:${env.port}${env.apiPrefix}`);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error: error.message });
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(1), 10000).unref();
  io.close();
  server.close(async () => {
    await mongoose.disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
