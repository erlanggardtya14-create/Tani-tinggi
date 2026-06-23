import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { authenticate } from '../../middlewares/auth.middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController();

  fastify.post('/register', { schema: { body: registerSchema } }, controller.register);
  fastify.post('/login', { schema: { body: loginSchema } }, controller.login);
  fastify.post('/refresh', { schema: { body: refreshTokenSchema } }, controller.refreshToken);
  fastify.post('/verify-email', { schema: { body: verifyEmailSchema } }, controller.verifyEmail);
  fastify.post('/forgot-password', { schema: { body: forgotPasswordSchema } }, controller.forgotPassword);
  fastify.post('/reset-password', { schema: { body: resetPasswordSchema } }, controller.resetPassword);

  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);
    
    protectedRoutes.post('/logout', { schema: { body: refreshTokenSchema } }, controller.logout);
    protectedRoutes.get('/me', controller.getMe);
  });
}
