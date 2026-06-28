import { FastifyInstance } from 'fastify';
import { ConsumerController } from './consumer.controller';
import { listRecordsQuerySchema } from '../farm-record/farm-record.schema';
import { qrTokenParam } from '../certificate/certificate.schema';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function consumerRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ConsumerController();

  // Public endpoints
  fastify.get('/scan/:qrToken', { schema: { params: qrTokenParam } }, controller.scanQrCode);
  fastify.get('/products', { schema: { querystring: listRecordsQuerySchema } }, controller.listCertifiedProducts);
}
