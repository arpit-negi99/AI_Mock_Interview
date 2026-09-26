import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorMiddleware(error, req, res, _next) {
  if (res.headersSent) return _next(error);
  const statusCode = error.statusCode || 500;
  const log = statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
  log(error.message, {
    statusCode,
    requestId: req.requestId,
    path: req.originalUrl,
    stack: statusCode >= 500 ? error.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
    requestId: req.requestId,
    details: error.details || undefined,
    stack: env.isProduction ? undefined : error.stack,
  });
}
