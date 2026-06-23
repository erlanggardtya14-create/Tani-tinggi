import Redis from 'ioredis';
import { env, isDev } from './env';

/**
 * Redis client singleton using ioredis.
 * Used by BullMQ for job queues and general caching.
 *
 * Design decision: We create a single shared connection for caching
 * but BullMQ creates its own connections internally.
 */

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    retryStrategy(times: number) {
      // Exponential backoff: 50ms, 100ms, 200ms, ..., max 10s
      const delay = Math.min(times * 50, 10000);
      return delay;
    },
    lazyConnect: false,
  });

  client.on('connect', () => {
    if (isDev) {
      console.log('✅ Redis connected');
    }
  });

  client.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  return client;
}

export const redis: Redis = globalForRedis.redis ?? createRedisClient();

if (isDev) {
  globalForRedis.redis = redis;
}

/**
 * Graceful shutdown: disconnect Redis on process exit.
 */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

/**
 * Health check: verify Redis connectivity.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
