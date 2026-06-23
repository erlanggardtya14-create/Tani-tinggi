import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

const adminService = new AdminService();

export class AdminController {
  async getPlatformStats(request: FastifyRequest, reply: FastifyReply) {
    const result = await adminService.getPlatformStats();
    return reply.status(200).send({ success: true, data: result });
  }

  async listAllRecords(request: FastifyRequest<{ Querystring: ListRecordsQuery & { farmerId?: string } }>, reply: FastifyReply) {
    const result = await adminService.listAllRecords(request.query);
    return reply.status(200).send({ success: true, data: result });
  }

  async listAllFarmers(request: FastifyRequest<{ Querystring: { cursor?: string; limit?: number; direction?: 'asc' | 'desc' } }>, reply: FastifyReply) {
    const query = {
       cursor: request.query.cursor,
       limit: request.query.limit || 20,
       direction: request.query.direction || 'desc' as const,
    };
    const result = await adminService.listAllFarmers(query);
    return reply.status(200).send({ success: true, data: result });
  }

  async overrideRecordStatus(request: FastifyRequest<{ Params: { id: string }, Body: { status: string } }>, reply: FastifyReply) {
    const result = await adminService.overrideRecordStatus(request.params.id, request.body.status);
    return reply.status(200).send({ success: true, data: result });
  }

  async updateAiModelVersion(request: FastifyRequest<{ Body: { version: string } }>, reply: FastifyReply) {
    const result = await adminService.updateAiModelVersion(request.body.version);
    return reply.status(200).send({ success: true, data: result });
  }

  async getQueueStats(request: FastifyRequest, reply: FastifyReply) {
    const result = await adminService.getQueueHealth();
    return reply.status(200).send({ success: true, data: result });
  }
}
