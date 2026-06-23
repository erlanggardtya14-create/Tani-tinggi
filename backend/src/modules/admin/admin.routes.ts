import { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller';
import { listRecordsQuerySchema } from '../farm-record/farm-record.schema';
import { requireRole } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

const overrideStatusSchema = z.object({
   status: z.enum(['PENDING', 'AI_VALIDATING', 'AI_REJECTED', 'CALCULATING', 'CERTIFYING', 'CERTIFIED', 'FAILED'])
});

const aiModelVersionSchema = z.object({
   version: z.string().min(1)
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AdminController();

  fastify.addHook('preHandler', requireRole('ADMIN'));

  fastify.get('/stats', controller.getPlatformStats);
  fastify.get('/records', { schema: { querystring: listRecordsQuerySchema.extend({ farmerId: z.string().optional() }) } }, controller.listAllRecords);
  fastify.get('/farmers', controller.listAllFarmers);
  fastify.put('/records/:id/override-status', { schema: { body: overrideStatusSchema } }, controller.overrideRecordStatus);
  fastify.post('/ai-model/version', { schema: { body: aiModelVersionSchema } }, controller.updateAiModelVersion);
  fastify.get('/queue/stats', controller.getQueueStats);
}
