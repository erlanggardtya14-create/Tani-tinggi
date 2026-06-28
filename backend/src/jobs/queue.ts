import { Queue, FlowProducer } from 'bullmq';
import { env } from '../config/env';

export const QUEUE_NAMES = {
  AI_VALIDATION: 'ai-validation',
  CARBON_SCORE: 'carbon-score',
  BLOCKCHAIN_MINT: 'blockchain-mint',
  NOTIFICATION: 'notification',
} as const;

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    password: parsed.password || undefined,
  };
}

const connection = parseRedisUrl(env.REDIS_URL);

export const aiValidationQueue = new Queue(QUEUE_NAMES.AI_VALIDATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const carbonScoreQueue = new Queue(QUEUE_NAMES.CARBON_SCORE, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const blockchainMintQueue = new Queue(QUEUE_NAMES.BLOCKCHAIN_MINT, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, { connection });

export const flowProducer = new FlowProducer({ connection });

export async function getQueueStats() {
  const [aiValidation, carbonScore, blockchainMint] = await Promise.all([
    aiValidationQueue.getJobCounts(),
    carbonScoreQueue.getJobCounts(),
    blockchainMintQueue.getJobCounts(),
  ]);
  
  return { aiValidation, carbonScore, blockchainMint };
}

export async function closeQueues() {
  await Promise.all([
    aiValidationQueue.close(),
    carbonScoreQueue.close(),
    blockchainMintQueue.close(),
    notificationQueue.close(),
    flowProducer.close(),
  ]);
}
