import { FastifyInstance } from 'fastify';
import { FarmRecordController } from './farm-record.controller';
import { listRecordsQuerySchema } from './farm-record.schema';
import { requireRole } from '../../middlewares/auth.middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function farmRecordRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new FarmRecordController();

  fastify.addHook('preHandler', requireRole('FARMER'));

  fastify.get('/', { schema: { querystring: listRecordsQuerySchema } }, controller.listRecords);
  fastify.get('/:id', controller.getRecord);
  fastify.get('/:id/certificate', controller.getCertificate);
  fastify.get('/:id/qr', controller.getQrCode);
  fastify.delete('/:id', controller.softDelete);
}
