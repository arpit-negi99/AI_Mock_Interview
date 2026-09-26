import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function connectDb() {
  if (!env.mongoUri) {
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
  return mongoose.connection.readyState === 1;
}
