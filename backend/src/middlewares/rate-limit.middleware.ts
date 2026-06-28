import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: function (request, context) {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded, retry in ${context.after}`,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
}
