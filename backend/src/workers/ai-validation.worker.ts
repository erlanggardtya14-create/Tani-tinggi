import { Worker, Job } from 'bullmq';
import { prisma } from '../config/database';
import { validatePlantImage } from '../services/ai/plant-validator';
import { carbonScoreQueue, QUEUE_NAMES } from '../jobs/queue';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AiValidationJobData {
  farmRecordId: string;
  imageUrl: string | null;
  vegetableType: string;
  imageHash: string | null;
}

export function createAiValidationWorker(connection: any) {
  return new Worker(
    QUEUE_NAMES.AI_VALIDATION,
    async (job: Job<AiValidationJobData>) => {
      const { farmRecordId, imageUrl, vegetableType, imageHash } = job.data;
      logger.info({ jobId: job.id, farmRecordId }, 'Starting AI validation');

      try {
        await prisma.farmRecord.update({
          where: { id: farmRecordId },
          data: { status: 'AI_VALIDATING' },
        });

        const validationResult = await validatePlantImage(imageUrl, vegetableType, imageHash);

        await prisma.aiValidation.create({
          data: {
            farmRecordId,
            isValidPlant: validationResult.isValidPlant,
            detectedClass: validationResult.detectedClass,
            confidence: validationResult.confidence,
            modelVersion: validationResult.modelVersion,
            processingMs: validationResult.processingMs,
            rawResponse: validationResult.rawResponse as any,
          },
        });

        if (validationResult.isValidPlant && validationResult.confidence >= env.AI_CONFIDENCE_THRESHOLD) {
          await prisma.farmRecord.update({
            where: { id: farmRecordId },
            data: { status: 'CALCULATING' },
          });
          
          await carbonScoreQueue.add('calculate-score', { farmRecordId });
          logger.info({ jobId: job.id, farmRecordId }, 'AI validation passed, queued for carbon score');
        } else {
          await prisma.farmRecord.update({
            where: { id: farmRecordId },
            data: { status: 'AI_REJECTED' },
          });
          logger.info({ jobId: job.id, farmRecordId }, 'AI validation rejected');
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id, farmRecordId }, 'AI validation failed');
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
