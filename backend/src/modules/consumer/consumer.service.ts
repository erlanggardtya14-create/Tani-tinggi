import { prisma } from '../../config/database';
import { CertificateService } from '../certificate/certificate.service';
import { ListRecordsQuery } from '../farm-record/farm-record.schema';

const certificateService = new CertificateService();

export class ConsumerService {
  async scanQrCode(qrToken: string) {
    const { certificate, blockchainVerification } = await certificateService.verifyByQrToken(qrToken);
    
    return {
       vegetableInfo: {
          type: certificate.farmRecord.vegetableType,
          weightKg: certificate.farmRecord.vegetableWeight,
          fertilizer: certificate.farmRecord.fertilizerType,
          pesticidesUsed: certificate.farmRecord.pesticidesUsed,
          imageUrl: certificate.farmRecord.imageUrl,
          capturedAt: certificate.farmRecord.capturedAt,
       },
       farmInfo: {
          name: certificate.farmRecord.farmer.farmName,
          location: certificate.farmRecord.farmer.farmLocation,
          farmerName: certificate.farmRecord.farmer.fullName,
       },
       ecoInfo: {
          score: certificate.farmRecord.carbonScore?.ecoScore,
          grade: certificate.farmRecord.carbonScore?.ecoGrade,
          totalCarbonKg: certificate.farmRecord.carbonScore?.totalCarbonKg,
       },
       blockchainProof: blockchainVerification
    };
  }

  async listCertifiedProducts(query: ListRecordsQuery) {
     const where = { status: 'CERTIFIED' as any, isDeleted: false };
     
     const records = await prisma.farmRecord.findMany({
         where,
         take: query.limit + 1,
         cursor: query.cursor ? { id: query.cursor } : undefined,
         orderBy: { createdAt: query.direction },
         include: {
             farmer: { select: { farmName: true, farmLocation: true, fullName: true } },
             carbonScore: { select: { ecoGrade: true, ecoScore: true } },
             certificate: { select: { id: true, txHash: true, qrCodeUrl: true } }
         }
     });

     let nextCursor: string | null = null;
     if (records.length > query.limit) {
         const nextItem = records.pop();
         nextCursor = nextItem!.id;
     }

     return {
         data: records.map(r => ({
             id: r.id,
             vegetableType: r.vegetableType,
             imageUrl: r.imageUrl,
             farmer: r.farmer,
             ecoScore: r.carbonScore?.ecoScore,
             ecoGrade: r.carbonScore?.ecoGrade,
             certificateId: r.certificate?.id,
             txHash: r.certificate?.txHash
         })),
         nextCursor,
         hasMore: nextCursor !== null,
     };
  }
}
