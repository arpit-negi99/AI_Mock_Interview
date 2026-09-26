import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import mongoose from 'mongoose';
import { frontendDist } from './config/production.js';
import { AppError } from './utils/AppError.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generalRateLimiter } from './middlewares/rateLimitMiddleware.js';
import { requestContextMiddleware } from './middlewares/requestContextMiddleware.js';
import { sanitizeMiddleware } from './middlewares/sanitizeMiddleware.js';
import { notFoundMiddleware } from './middlewares/notFoundMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import routes from './routes/index.js';

const corsOrigin = (origin, callback) => {
  if (!origin || env.clientOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS origin not allowed: ${origin}`));
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxyHops);

  app.use(requestContextMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(compression());
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeMiddleware);
  app.use(hpp());
  app.get(`${env.apiPrefix}/health/ready`, (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
  });
  if (!env.isProduction) app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
  app.use(env.apiPrefix, generalRateLimiter, (_req, _res, next) => {
    if (env.isProduction && mongoose.connection.readyState !== 1) {
      return next(new AppError('Database temporarily unavailable. Please try again shortly.', 503));
    }
    return next();
  }, routes, notFoundMiddleware);
  if (env.serveFrontend) {
    app.use(express.static(frontendDist, { index: false, setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', filePath.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
    } }));
    app.get('/{*page}', (req, res, next) => {
      if (req.path.startsWith('/uploads/') || path.extname(req.path) || !req.accepts('html')) return next();
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
