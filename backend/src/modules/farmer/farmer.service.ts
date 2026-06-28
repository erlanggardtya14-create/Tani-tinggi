import { prisma } from '../../config/database';
import { UpdateProfileInput } from './farmer.schema';
import { FarmRecordService } from '../farm-record/farm-record.service';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

const farmRecordService = new FarmRecordService();

export class FarmerService {
  async getProfile(userId: string) {
      const farmer = await prisma.farmer.findUnique({
          where: { userId },
          include: { user: { select: { email: true, isVerified: true } } }
      });
      if (!farmer) throw Object.assign(new Error('Farmer profile not found'), { statusCode: 404 });
      return farmer;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
      const farmer = await prisma.farmer.findUnique({ where: { userId } });
      if (!farmer) throw Object.assign(new Error('Farmer profile not found'), { statusCode: 404 });

      return prisma.farmer.update({
          where: { id: farmer.id },
          data
      });
  }

  async getDashboard(farmerId: string) {
      const stats = await prisma.farmRecord.groupBy({
          by: ['status'],
          where: { farmerId, isDeleted: false },
          _count: { id: true }
      });

      const totalRecords = stats.reduce((acc, curr) => acc + curr._count.id, 0);
      const certifiedCount = stats.find(s => s.status === 'CERTIFIED')?._count.id || 0;

      const carbonScores = await prisma.carbonScore.aggregate({
          where: { farmRecord: { farmerId, isDeleted: false, status: 'CERTIFIED' } },
          _avg: { ecoScore: true }
      });

      return {
          totalRecords,
          certifiedCount,
          avgEcoScore: Math.round(carbonScores._avg.ecoScore || 0),
          recordsByStatus: stats.reduce((acc: any, curr) => {
             acc[curr.status] = curr._count.id;
             return acc;
          }, {})
      };
  }

  async listRecords(farmerId: string, pagination: ListRecordsQuery) {
     return farmRecordService.listRecords(farmerId, pagination);
  }
}
