import { FastifyInstance } from 'fastify';
import { SyncController } from './sync.controller';
import { syncBatchSchema } from './sync.schema';
import { requireRole } from '../../middlewares/auth.middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new SyncController();

  fastify.addHook('preHandler', requireRole('FARMER'));

  fastify.post('/', { schema: { body: syncBatchSchema } }, controller.syncBatch);
  fastify.get('/status/:syncId', controller.getSyncStatus);
  fastify.get('/pending', controller.getPendingRecords);
}
