import { Worker, Job } from 'bullmq';
import { prisma } from '../config/database';
import { calculateEcoScore, isEligibleForCertification } from '../services/carbon/eco-score.service';
import { blockchainMintQueue, QUEUE_NAMES } from '../jobs/queue';
import { logger } from '../utils/logger';

interface CarbonScoreJobData {
  farmRecordId: string;
}

export function createCarbonScoreWorker(connection: any) {
  return new Worker(
    QUEUE_NAMES.CARBON_SCORE,
    async (job: Job<CarbonScoreJobData>) => {
      const { farmRecordId } = job.data;
      logger.info({ jobId: job.id, farmRecordId }, 'Starting Carbon Score calculation');

      try {
        const record = await prisma.farmRecord.findUnique({
          where: { id: farmRecordId },
          include: { deliveryInfo: true },
        });

        if (!record || !record.deliveryInfo) {
          throw new Error('Farm record or delivery info not found');
        }

        const input = {
          distanceKm: record.deliveryInfo.distanceKm,
          weightKg: record.vegetableWeight,
          vehicleType: record.deliveryInfo.vehicleType,
          fertilizerType: record.fertilizerType,
          pesticidesUsed: record.pesticidesUsed,
        };

        const result = calculateEcoScore(input);

        await prisma.carbonScore.create({
          data: {
            farmRecordId,
            deliveryInfoId: record.deliveryInfo.id,
            rawCarbonKg: result.rawCarbonKg,
            fertilizerPenalty: result.fertilizerPenalty,
            totalCarbonKg: result.totalCarbonKg,
            ecoGrade: result.ecoGrade as any,
            ecoScore: result.ecoScore,
            calculationVersion: result.calculationVersion,
          },
        });

        if (isEligibleForCertification(result.ecoGrade)) {
          await prisma.farmRecord.update({
            where: { id: farmRecordId },
            data: { status: 'CERTIFYING' },
          });
          
          await blockchainMintQueue.add('mint-certificate', { farmRecordId });
          logger.info({ jobId: job.id, farmRecordId, grade: result.ecoGrade }, 'Eligible for certification, queued for minting');
        } else {
          await prisma.farmRecord.update({
            where: { id: farmRecordId },
            data: { status: 'FAILED' },
          });
          logger.info({ jobId: job.id, farmRecordId, grade: result.ecoGrade }, 'Not eligible for certification');
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id, farmRecordId }, 'Carbon score calculation failed');
        await prisma.farmRecord.update({
          where: { id: farmRecordId },
          data: { status: 'FAILED' },
        });
        throw error;
      }
    },
    { connection }
  );
}
