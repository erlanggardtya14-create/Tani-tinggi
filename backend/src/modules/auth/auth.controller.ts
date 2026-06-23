import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.schema';

const authService = new AuthService();

export class AuthController {
  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    const result = await authService.register(request.body);
    return reply.status(201).send({ success: true, data: result });
  }

  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const result = await authService.login(request.body);
    return reply.status(200).send({ success: true, data: result });
  }

  async refreshToken(request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
    const result = await authService.refreshToken(request.body.refreshToken);
    return reply.status(200).send({ success: true, data: result });
  }

  async logout(request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
    await authService.logout(request.body.refreshToken);
    return reply.status(200).send({ success: true, message: 'Logged out successfully' });
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.currentUser?.sub;
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    
    const user = await authService.getMe(userId);
    return reply.status(200).send({ success: true, data: user });
  }

  async verifyEmail(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
    await authService.verifyEmail(request.body.token);
    return reply.status(200).send({ success: true, message: 'Email verified' });
  }

  async forgotPassword(request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) {
    const token = await authService.forgotPassword(request.body.email);
    return reply.status(200).send({ success: true, message: 'Password reset email sent', devToken: token }); // devToken just for easier testing
  }

  async resetPassword(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    await authService.resetPassword(request.body.token, request.body.newPassword);
    return reply.status(200).send({ success: true, message: 'Password reset successful' });
  }
}
