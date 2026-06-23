import { prisma } from '../../config/database';
import { SyncBatchInput, SyncRecordInput, SyncResult, SyncRecordResult } from '../../types';
import { uploadImage } from '../../services/storage/cloudinary.service';
import { aiValidationQueue } from '../../jobs/queue';
import { logger } from '../../utils/logger';

export class SyncService {
  async syncBatch(farmerId: string, input: SyncBatchInput): Promise<SyncResult> {
    const syncBatch = await prisma.syncBatch.create({
      data: {
        farmerId,
        deviceId: input.deviceId,
        totalCount: input.records.length,
        syncedAt: new Date(input.syncedAt),
        status: 'PROCESSING',
      },
    });

    const success: SyncRecordResult[] = [];
    const failed: SyncRecordResult[] = [];
    const skipped: SyncRecordResult[] = [];

    for (const recordInput of input.records) {
      try {
        const existingRecord = await prisma.farmRecord.findUnique({
          where: { farmerId_localId: { farmerId, localId: recordInput.localId } },
        });

        if (existingRecord) {
          skipped.push({ localId: recordInput.localId, recordId: existingRecord.id, status: 'SKIPPED', reason: 'Already synced' });
          continue;
        }

        let finalImageUrl = recordInput.imageUrl;
        if (recordInput.imageBase64 && !finalImageUrl) {
            const { url } = await uploadImage(recordInput.imageBase64, 'farm-records');
            finalImageUrl = url;
        }

        const newRecord = await prisma.$transaction(async (tx) => {
          const farmRecord = await tx.farmRecord.create({
            data: {
              farmerId,
              localId: recordInput.localId,
              vegetableType: recordInput.vegetableType,
              vegetableWeight: recordInput.vegetableWeight,
              fertilizerType: recordInput.fertilizerType as any,
              fertilizerBrand: recordInput.fertilizerBrand,
              pesticidesUsed: recordInput.pesticidesUsed,
              imageUrl: finalImageUrl,
              imageHash: recordInput.imageHash,
              capturedAt: new Date(recordInput.capturedAt),
              syncedAt: new Date(),
              status: 'PENDING',
              deliveryInfo: {
                 create: {
                    distanceKm: recordInput.delivery.distanceKm,
                    vehicleType: recordInput.delivery.vehicleType as any,
                    vehicleCapacity: recordInput.delivery.vehicleCapacity,
                    destinationCity: recordInput.delivery.destinationCity,
                    deliveryDate: recordInput.delivery.deliveryDate ? new Date(recordInput.delivery.deliveryDate) : null,
                 }
              }
            },
            include: { deliveryInfo: true }
          });
          return farmRecord;
        });

        await aiValidationQueue.add('validate-image', {
           farmRecordId: newRecord.id,
           imageUrl: newRecord.imageUrl,
           vegetableType: newRecord.vegetableType,
           imageHash: newRecord.imageHash,
        });

        success.push({ localId: recordInput.localId, recordId: newRecord.id, status: 'SUCCESS' });
      } catch (error: any) {
        logger.error({ err: error, localId: recordInput.localId }, 'Failed to sync record');
        failed.push({ localId: recordInput.localId, status: 'FAILED', reason: error.message });
      }
    }

    await prisma.syncBatch.update({
       where: { id: syncBatch.id },
       data: {
          success: success.length,
          failed: failed.length,
          skipped: skipped.length,
          status: failed.length === 0 ? 'COMPLETED' : (success.length > 0 ? 'PARTIAL' : 'FAILED')
       }
    });

    return { syncId: syncBatch.id, success, failed, skipped };
  }

  async getSyncStatus(syncId: string, farmerId: string) {
     const batch = await prisma.syncBatch.findUnique({ where: { id: syncId } });
     if (!batch || batch.farmerId !== farmerId) {
         throw Object.assign(new Error('Sync batch not found'), { statusCode: 404 });
     }
     return batch;
  }

  async getPendingRecords(farmerId: string) {
     return prisma.farmRecord.findMany({
         where: { farmerId, status: 'PENDING', isDeleted: false },
         orderBy: { createdAt: 'desc' }
     });
  }
}
