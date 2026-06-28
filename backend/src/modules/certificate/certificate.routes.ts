import { FastifyInstance } from 'fastify';
import { CertificateController } from './certificate.controller';
import { qrTokenParam, certificateIdParam, txHashParam, retryParam } from './certificate.schema';
import { requireRole, authenticate } from '../../middlewares/auth.middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function certificateRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new CertificateController();

  // Public endpoint
  fastify.get('/verify/:qrToken', { schema: { params: qrTokenParam } }, controller.verifyByQrToken);

  // Protected endpoints
  fastify.register(async (protectedRoutes) => {
     protectedRoutes.addHook('preHandler', authenticate);
     
     protectedRoutes.get('/:id', { schema: { params: certificateIdParam } }, controller.getById);
     protectedRoutes.get('/blockchain/:txHash', { schema: { params: txHashParam } }, controller.verifyOnBlockchain);
  });

  // Admin endpoints
  fastify.register(async (adminRoutes) => {
     adminRoutes.addHook('preHandler', requireRole('ADMIN'));
     adminRoutes.post('/retry/:recordId', { schema: { params: retryParam } }, controller.retryMinting);
  });
}
