import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  if (!env.mongoUri) {
    logger.warn('MONGODB_URI is empty. Running with in-memory development stores.');
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { autoIndex: !env.isProduction });
    logger.info('MongoDB connected');
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed. Falling back to in-memory stores.', { error: error.message });
    return false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
