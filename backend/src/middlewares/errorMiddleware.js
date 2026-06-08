import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  logger.error(error.message, {
    statusCode,
    requestId: req.requestId,
    path: req.originalUrl,
    stack: error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
    requestId: req.requestId,
    details: error.details || undefined,
    stack: env.isProduction ? undefined : error.stack,
  });
}
