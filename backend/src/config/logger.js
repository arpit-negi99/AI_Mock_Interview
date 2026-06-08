import winston from 'winston';
import { env } from './env.js';

export const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'voice-ai-interview-api' },
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});
