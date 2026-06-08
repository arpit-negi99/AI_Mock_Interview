import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

const connection = getRedisClient();
const queues = connection
  ? {
      aiQuestion: new Queue('ai-question', { connection }),
      speechToText: new Queue('speech-to-text', { connection }),
      textToSpeech: new Queue('text-to-speech', { connection }),
    }
  : null;

export const queueService = {
  async add(queueName, jobName, payload, inlineHandler) {
    if (queues?.[queueName]) {
      const job = await queues[queueName].add(jobName, payload, { attempts: 2, removeOnComplete: true });
      logger.info('Queued job', { queueName, jobName, jobId: job.id });
      return { queued: true, jobId: job.id };
    }
    const data = inlineHandler ? await inlineHandler(payload) : null;
    return { queued: false, data };
  },
};
