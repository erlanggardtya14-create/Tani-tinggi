import { FastifyRequest, FastifyReply } from 'fastify';
import { FarmerService } from './farmer.service';
import { UpdateProfileInput } from './farmer.schema';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

const farmerService = new FarmerService();

export class FarmerController {
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.currentUser?.sub;
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const result = await farmerService.getProfile(userId);
    return reply.status(200).send({ success: true, data: result });
  }

  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) {
    const userId = request.currentUser?.sub;
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const result = await farmerService.updateProfile(userId, request.body);
    return reply.status(200).send({ success: true, data: result });
  }

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.currentUser?.sub;
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    
    // We need the farmerId, which we can get from the profile
    const profile = await farmerService.getProfile(userId);

    const result = await farmerService.getDashboard(profile.id);
    return reply.status(200).send({ success: true, data: result });
  }

  async listRecords(request: FastifyRequest<{ Querystring: ListRecordsQuery }>, reply: FastifyReply) {
    const userId = request.currentUser?.sub;
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const profile = await farmerService.getProfile(userId);
    const result = await farmerService.listRecords(profile.id, request.query);
    return reply.status(200).send({ success: true, data: result });
  }
}
