import { FastifyRequest, FastifyReply } from 'fastify';
import { ConsumerService } from './consumer.service';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

const consumerService = new ConsumerService();

export class ConsumerController {
  async scanQrCode(request: FastifyRequest<{ Params: { qrToken: string } }>, reply: FastifyReply) {
    const result = await consumerService.scanQrCode(request.params.qrToken);
    return reply.status(200).send({ success: true, data: result });
  }

  async listCertifiedProducts(request: FastifyRequest<{ Querystring: ListRecordsQuery }>, reply: FastifyReply) {
    const result = await consumerService.listCertifiedProducts(request.query);
    return reply.status(200).send({ success: true, data: result });
  }
}
