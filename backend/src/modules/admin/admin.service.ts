import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { getQueueStats } from '../../jobs/queue';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

export class AdminService {
  async getPlatformStats() {
    const [totalFarmers, totalRecords, certifiedCount] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmRecord.count({ where: { isDeleted: false } }),
      prisma.farmRecord.count({ where: { status: 'CERTIFIED', isDeleted: false } })
    ]);

    const recordsByStatus = await prisma.farmRecord.groupBy({
       by: ['status'],
       where: { isDeleted: false },
       _count: { id: true }
    });

    const carbonStats = await prisma.carbonScore.aggregate({
       _avg: { ecoScore: true },
    });

    const recordsByGrade = await prisma.carbonScore.groupBy({
       by: ['ecoGrade'],
       _count: { id: true }
    });

    return {
       totalFarmers,
       totalRecords,
       certifiedCount,
       avgEcoScore: carbonStats._avg.ecoScore ? Math.round(carbonStats._avg.ecoScore) : 0,
       recordsByStatus: recordsByStatus.reduce((acc: any, curr) => {
          acc[curr.status] = curr._count.id;
          return acc;
       }, {}),
       recordsByGrade: recordsByGrade.reduce((acc: any, curr) => {
          acc[curr.ecoGrade] = curr._count.id;
          return acc;
       }, {})
    };
  }

  async listAllRecords(query: ListRecordsQuery & { farmerId?: string }) {
     const where: any = { isDeleted: false };
     if (query.status) where.status = query.status;
     if (query.grade) where.carbonScore = { ecoGrade: query.grade };
     if (query.farmerId) where.farmerId = query.farmerId;
     if (query.startDate || query.endDate) {
         where.createdAt = {};
         if (query.startDate) where.createdAt.gte = new Date(query.startDate);
         if (query.endDate) where.createdAt.lte = new Date(query.endDate);
     }

     const records = await prisma.farmRecord.findMany({
         where,
         take: query.limit + 1,
         cursor: query.cursor ? { id: query.cursor } : undefined,
         orderBy: { createdAt: query.direction },
         include: { farmer: true, carbonScore: true, certificate: true },
     });

     let nextCursor: string | null = null;
     if (records.length > query.limit) {
         const nextItem = records.pop();
         nextCursor = nextItem!.id;
     }

     return {
         data: records,
         nextCursor,
         hasMore: nextCursor !== null,
     };
  }

  async listAllFarmers(query: { cursor?: string; limit: number; direction?: 'asc' | 'desc' }) {
     const farmers = await prisma.farmer.findMany({
         take: query.limit + 1,
         cursor: query.cursor ? { id: query.cursor } : undefined,
         orderBy: { createdAt: query.direction || 'desc' },
         include: {
            user: { select: { email: true, isVerified: true } },
            _count: { select: { farmRecords: true } }
         }
     });

     let nextCursor: string | null = null;
     if (farmers.length > query.limit) {
         const nextItem = farmers.pop();
         nextCursor = nextItem!.id;
     }

     return {
         data: farmers,
         nextCursor,
         hasMore: nextCursor !== null,
     };
  }

  async overrideRecordStatus(recordId: string, newStatus: string) {
     const record = await prisma.farmRecord.findUnique({ where: { id: recordId } });
     if (!record) throw Object.assign(new Error('Record not found'), { statusCode: 404 });

     await prisma.farmRecord.update({
        where: { id: recordId },
        data: { status: newStatus as any }
     });
     
     return { recordId, status: newStatus };
  }

  async updateAiModelVersion(version: string) {
      // In a real app, this might update a DB config table or external service
      // Here we just return what would be updated
      return { version, message: `Model version reference updated to ${version}` };
  }

  async getQueueHealth() {
     return getQueueStats();
  }
}
