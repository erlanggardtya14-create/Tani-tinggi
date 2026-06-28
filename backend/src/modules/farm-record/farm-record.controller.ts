import { FastifyRequest, FastifyReply } from 'fastify';
import { FarmRecordService } from './farm-record.service';
import { ListRecordsQuery } from './farm-record.schema';

const farmRecordService = new FarmRecordService();

export class FarmRecordController {
  async listRecords(request: FastifyRequest<{ Querystring: ListRecordsQuery }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await farmRecordService.listRecords(farmerId, request.query);
    return reply.status(200).send({ success: true, data: result });
  }

  async getRecord(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await farmRecordService.getRecord(request.params.id, farmerId);
    return reply.status(200).send({ success: true, data: result });
  }

  async getCertificate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await farmRecordService.getCertificate(request.params.id, farmerId);
    return reply.status(200).send({ success: true, data: result });
  }

  async getQrCode(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await farmRecordService.getQrCode(request.params.id, farmerId);
    return reply.status(200).send({ success: true, data: result });
  }

  async softDelete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    await farmRecordService.softDelete(request.params.id, farmerId);
    return reply.status(200).send({ success: true, message: 'Record deleted' });
  }
}
