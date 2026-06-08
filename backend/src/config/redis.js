import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient = null;

export function getRedisClient() {
  if (!env.enableRedis || !env.redisUrl) return null;
  if (redisClient) return redisClient;

  redisClient = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (error) => logger.warn('Redis error', { error: error.message }));
  return redisClient;
}

export async function cacheSession(sessionId, value, ttlSeconds = 3600) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(`session:${sessionId}`, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function readCachedSession(sessionId) {
  const redis = getRedisClient();
  if (!redis) return null;
  const value = await redis.get(`session:${sessionId}`);
  return value ? JSON.parse(value) : null;
}
