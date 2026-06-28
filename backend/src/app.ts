import Fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform, ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env, isDev, loadJwtKeys } from './config/env';
import { prisma, disconnectDatabase, checkDatabaseHealth } from './config/database';
import { redis, disconnectRedis, checkRedisHealth } from './config/redis';
import { closeQueues } from './jobs/queue';
import { logger } from './utils/logger';

// ─── Route imports ───────────────────────────────────────────────────────────
import { authRoutes } from './modules/auth/auth.routes';
import { farmerRoutes } from './modules/farmer/farmer.routes';
import { syncRoutes } from './modules/sync/sync.routes';
import { farmRecordRoutes } from './modules/farm-record/farm-record.routes';
import { certificateRoutes } from './modules/certificate/certificate.routes';
import { consumerRoutes } from './modules/consumer/consumer.routes';
import { adminRoutes } from './modules/admin/admin.routes';

// ─── Middleware imports ──────────────────────────────────────────────────────
import { setErrorHandler } from './middlewares/error-handler';
import { registerRateLimit } from './middlewares/rate-limit.middleware';

/**
 * Build the Fastify application with all plugins, middleware, and routes.
 * This factory pattern enables testing with isolated instances.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    // Generate unique request IDs for tracing
    genReqId: () => crypto.randomUUID(),
    // Increase body limit to 50MB for image uploads (base64)
    bodyLimit: 52_428_800,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ─── Plugins ─────────────────────────────────────────────────────────────

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false, // Disable CSP for Swagger UI
  });

  // Rate limiting
  await registerRateLimit(app);

  // Multipart (file uploads)
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 10_485_760, // 10MB per file
      files: 5,
    },
  });

  // Swagger documentation
  await app.register(import('@fastify/swagger'), {
    transform: jsonSchemaTransform,
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Tani Tinggi API',
        description:
          'AI-powered eco-friendly highland vegetable certification with blockchain immutability',
        version: '1.0.0',
        contact: {
          name: 'Tani Tinggi Team',
          url: 'https://tanitinggi.app',
          email: 'api@tanitinggi.app',
        },
      },
      servers: [
        { url: env.APP_URL, description: env.NODE_ENV },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication & authorization' },
        { name: 'Farmer', description: 'Farmer profile management' },
        { name: 'Sync', description: 'Offline data synchronization' },
        { name: 'Records', description: 'Farm record management' },
        { name: 'Certificate', description: 'Blockchain certification' },
        { name: 'Consumer', description: 'Consumer verification' },
        { name: 'Admin', description: 'Platform administration' },
        { name: 'Health', description: 'Health & monitoring' },
      ],
    },
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // ─── Error Handler ───────────────────────────────────────────────────────
  setErrorHandler(app);

  // ─── Health Check Routes ─────────────────────────────────────────────────

  const appZod = app.withTypeProvider<ZodTypeProvider>();

  appZod.get('/api/v1/health', {
    schema: {
      tags: ['Health'],
      summary: 'Basic health check',
    },
  }, async (_request, _reply) => {
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const status = dbHealthy && redisHealthy ? 'ok' : 'degraded';

    return {
      status,
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy,
        redis: redisHealthy,
      },
    };
  });

  appZod.get('/api/v1/health/deep', {
    schema: {
      tags: ['Health'],
      summary: 'Deep health check (admin only)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    // In a full implementation, this would check AI model, blockchain, queues, etc.
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const queueStats = await import('./jobs/queue').then((m) => m.getQueueStats());

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: dbHealthy,
        redis: redisHealthy,
        blockchain: env.POLYGON_PRIVATE_KEY !== '' && env.CONTRACT_ADDRESS !== '',
      },
      queues: queueStats,
      memory: process.memoryUsage(),
    };
  });

  appZod.get('/api/v1/metrics', {
    schema: {
      tags: ['Health'],
      summary: 'Basic platform metrics',
    },
  }, async () => {
    const [totalRecords, certifiedRecords, totalFarmers] = await Promise.all([
      prisma.farmRecord.count({ where: { isDeleted: false } }),
      prisma.farmRecord.count({ where: { status: 'CERTIFIED', isDeleted: false } }),
      prisma.farmer.count(),
    ]);

    return {
      totalRecords,
      certifiedRecords,
      totalFarmers,
      certificationRate: totalRecords > 0
        ? Math.round((certifiedRecords / totalRecords) * 100)
        : 0,
      timestamp: new Date().toISOString(),
    };
  });

  // ─── API Routes ──────────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(farmerRoutes, { prefix: '/api/v1/farmer' });
  await app.register(syncRoutes, { prefix: '/api/v1/sync' });
  await app.register(farmRecordRoutes, { prefix: '/api/v1/records' });
  await app.register(certificateRoutes, { prefix: '/api/v1/certificate' });
  await app.register(consumerRoutes, { prefix: '/api/v1/consumer' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  // ─── Route listing on startup ────────────────────────────────────────────
  app.addHook('onReady', async () => {
    const routes = app.printRoutes({ commonPrefix: false });
    app.log.info(`\n📋 Registered routes:\n${routes}`);
  });

  return app;
}

// ─── Server Start ────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  let app: FastifyInstance | undefined;

  try {
    app = await buildApp();

    // Start listening
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Listen on all interfaces (required for Docker)
    });

    app.log.info(`🚀 Tani Tinggi API running at ${env.APP_URL}`);
    app.log.info(`📚 Swagger docs at ${env.APP_URL}/api/docs`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

  // ─── Graceful Shutdown ─────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n⚡ Received ${signal}. Shutting down gracefully...`);

    try {
      if (app) {
        await app.close();
      }
      await closeQueues();
      await disconnectRedis();
      await disconnectDatabase();
      console.log('✅ Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Prevent unhandled rejections from crashing the process
  process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
}

// Only start if this is the main module (not imported for testing)
if (require.main === module) {
  start();
}

export { start };
