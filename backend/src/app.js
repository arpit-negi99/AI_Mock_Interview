import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generalRateLimiter } from './middlewares/rateLimitMiddleware.js';
import { requestContextMiddleware } from './middlewares/requestContextMiddleware.js';
import { sanitizeMiddleware } from './middlewares/sanitizeMiddleware.js';
import { notFoundMiddleware } from './middlewares/notFoundMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(requestContextMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(compression());
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeMiddleware);
  app.use(hpp());
  app.use(generalRateLimiter);
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
  app.use(env.apiPrefix, routes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
