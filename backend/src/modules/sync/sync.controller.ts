import { FastifyRequest, FastifyReply } from 'fastify';
import { SyncService } from './sync.service';
import { SyncBatchInput } from './sync.schema';

const syncService = new SyncService();

export class SyncController {
  async syncBatch(request: FastifyRequest<{ Body: SyncBatchInput }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await syncService.syncBatch(farmerId, request.body);
    return reply.status(202).send({ success: true, data: result });
  }

  async getSyncStatus(request: FastifyRequest<{ Params: { syncId: string } }>, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await syncService.getSyncStatus(request.params.syncId, farmerId);
    return reply.status(200).send({ success: true, data: result });
  }

  async getPendingRecords(request: FastifyRequest, reply: FastifyReply) {
    const farmerId = request.currentUser?.farmerId;
    if (!farmerId) throw Object.assign(new Error('Unauthorized: Farmer profile required'), { statusCode: 401 });

    const result = await syncService.getPendingRecords(farmerId);
    return reply.status(200).send({ success: true, data: result });
  }
}
