import { FastifyInstance } from 'fastify';
import { FarmerController } from './farmer.controller';
import { updateProfileSchema } from './farmer.schema';
import { listRecordsQuerySchema } from '../farm-record/farm-record.schema';
import { requireRole } from '../../middlewares/auth.middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function farmerRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new FarmerController();

  fastify.addHook('preHandler', requireRole('FARMER'));

  fastify.get('/profile', controller.getProfile);
  fastify.put('/profile', { schema: { body: updateProfileSchema } }, controller.updateProfile);
  fastify.get('/dashboard', controller.getDashboard);
  fastify.get('/records', { schema: { querystring: listRecordsQuerySchema } }, controller.listRecords);
}
