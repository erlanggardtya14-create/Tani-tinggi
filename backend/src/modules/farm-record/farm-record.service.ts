import { prisma } from '../../config/database';
import { ListRecordsQuery } from './farm-record.schema';

export class FarmRecordService {
  async listRecords(farmerId: string, query: ListRecordsQuery) {
     const where: any = { farmerId, isDeleted: false };
     if (query.status) where.status = query.status;
     if (query.grade) where.carbonScore = { ecoGrade: query.grade };
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
         include: { carbonScore: true, certificate: true },
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

  async getRecord(id: string, farmerId: string) {
      const record = await prisma.farmRecord.findUnique({
          where: { id },
          include: { aiValidation: true, carbonScore: true, certificate: true, deliveryInfo: true }
      });
      if (!record || record.farmerId !== farmerId || record.isDeleted) {
          throw Object.assign(new Error('Record not found'), { statusCode: 404 });
      }
      return record;
  }

  async getCertificate(id: string, farmerId: string) {
      const record = await this.getRecord(id, farmerId);
      if (!record.certificate) {
          throw Object.assign(new Error('Certificate not found for this record'), { statusCode: 404 });
      }
      return record.certificate;
  }

  async getQrCode(id: string, farmerId: string) {
      const certificate = await this.getCertificate(id, farmerId);
      if (!certificate.qrCodeUrl) {
          throw Object.assign(new Error('QR code not available'), { statusCode: 404 });
      }
      return { qrCodeUrl: certificate.qrCodeUrl };
  }

  async softDelete(id: string, farmerId: string) {
      const record = await this.getRecord(id, farmerId);
      if (record.status !== 'PENDING' && record.status !== 'FAILED') {
          throw Object.assign(new Error('Only PENDING or FAILED records can be deleted'), { statusCode: 400 });
      }
      await prisma.farmRecord.update({
          where: { id },
          data: { isDeleted: true }
      });
  }
}
