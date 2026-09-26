import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import { AppError } from '../utils/AppError.js';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function connectDb() {
  if (!env.mongoUri) {
    if (env.isProduction) throw new Error('MONGODB_URI is required in production');
    logger.warn('MONGODB_URI is empty. Running with in-memory development stores.');
    return false;
  }

  for (let attempt = 1; attempt <= env.mongoConnectRetries; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, {
        autoIndex: !env.isProduction,
        serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
      });
      logger.info('MongoDB connected', { attempt });
      return true;
    } catch (error) {
      await mongoose.disconnect().catch(() => undefined);

      if (attempt === env.mongoConnectRetries) {
        if (env.isProduction) throw new Error('MongoDB connection failed. Production startup stopped; temporary storage is disabled.');
        logger.error('MongoDB connection failed after retries. Falling back to in-memory stores.', {
          attempts: attempt,
          error: error.message,
        });
        return false;
      }

      logger.warn('MongoDB connection failed. Retrying.', {
        attempt,
        error: error.message,
        nextAttemptInMs: env.mongoRetryDelayMs,
      });
      await wait(env.mongoRetryDelayMs);
    }
  }

  return false;
}

export function isDbConnected() {
  const connected = mongoose.connection.readyState === 1;
  if (!connected && env.isProduction) throw new AppError('Database temporarily unavailable. Please try again shortly.', 503);
  return connected;
}
