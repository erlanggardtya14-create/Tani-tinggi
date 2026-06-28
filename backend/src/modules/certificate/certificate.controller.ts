import { FastifyRequest, FastifyReply } from 'fastify';
import { CertificateService } from './certificate.service';

const certificateService = new CertificateService();

export class CertificateController {
  async verifyByQrToken(request: FastifyRequest<{ Params: { qrToken: string } }>, reply: FastifyReply) {
    const result = await certificateService.verifyByQrToken(request.params.qrToken);
    return reply.status(200).send({ success: true, data: result });
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await certificateService.getById(request.params.id);
    return reply.status(200).send({ success: true, data: result });
  }

  async verifyOnBlockchain(request: FastifyRequest<{ Params: { txHash: string } }>, reply: FastifyReply) {
    const result = await certificateService.verifyOnBlockchain(request.params.txHash);
    return reply.status(200).send({ success: true, data: result });
  }

  async retryMinting(request: FastifyRequest<{ Params: { recordId: string } }>, reply: FastifyReply) {
    const result = await certificateService.retryMinting(request.params.recordId);
    return reply.status(200).send({ success: true, data: result });
  }
}
