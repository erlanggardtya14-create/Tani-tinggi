import { Worker, Job } from 'bullmq';
import { prisma } from '../config/database';
import { generateDataHash } from '../utils/hash.util';
import { mintCertificate } from '../services/blockchain/polygon.service';
import { generateQrCode } from '../utils/qr-code.util';
import { uploadImage } from '../services/storage/cloudinary.service';
import { QUEUE_NAMES } from '../jobs/queue';
import { logger } from '../utils/logger';

interface BlockchainMintJobData {
  farmRecordId: string;
}

export function createBlockchainMintWorker(connection: any) {
  return new Worker(
    QUEUE_NAMES.BLOCKCHAIN_MINT,
    async (job: Job<BlockchainMintJobData>) => {
      const { farmRecordId } = job.data;
      logger.info({ jobId: job.id, farmRecordId }, 'Starting Blockchain minting');

      try {
        const record = await prisma.farmRecord.findUnique({
          where: { id: farmRecordId },
          include: { farmer: { include: { user: true } }, carbonScore: true },
        });

        if (!record || !record.carbonScore) {
          throw new Error('Farm record or carbon score not found');
        }

        let certificate = await prisma.certificate.findUnique({ where: { farmRecordId } });
        
        if (!certificate) {
          certificate = await prisma.certificate.create({
            data: { farmRecordId, status: 'MINTING' },
          });
        } else {
          await prisma.certificate.update({
             where: { id: certificate.id },
             data: { status: 'MINTING' }
          });
        }

        const dataHash = generateDataHash(record);
        // Mock recipient address or get from farmer profile if you store it
        const recipientAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual logic
        const metadataUri = `ipfs://mock-metadata-${farmRecordId}`; // Mock IPFS URI

        const { txHash, tokenId } = await mintCertificate(recipientAddress, metadataUri, dataHash);

        const qrPayload = {
          certId: certificate.id,
          farmRecordId,
          txHash,
          tokenId,
          ecoGrade: record.carbonScore.ecoGrade,
          ecoScore: record.carbonScore.ecoScore,
          vegetableType: record.vegetableType,
          farmName: record.farmer.farmName,
          farmerName: record.farmer.fullName,
          issuedAt: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60,
        };

        const { qrBuffer, qrData } = await generateQrCode(qrPayload);
        const { url: qrCodeUrl } = await uploadImage(qrBuffer.toString('base64'), 'qrcodes');

        await prisma.certificate.update({
          where: { id: certificate.id },
          data: {
            txHash,
            tokenId,
            qrCodeUrl,
            qrCodeData: qrData,
            status: 'MINTED',
            issuedAt: new Date(),
          },
        });

        await prisma.farmRecord.update({
          where: { id: farmRecordId },
          data: { status: 'CERTIFIED' },
        });
        
        logger.info({ jobId: job.id, farmRecordId, txHash }, 'Certificate minted successfully');

      } catch (error: any) {
        logger.error({ err: error, jobId: job.id, farmRecordId }, 'Blockchain minting failed');
        
        const certificate = await prisma.certificate.findUnique({ where: { farmRecordId } });
        if (certificate) {
           await prisma.certificate.update({
              where: { id: certificate.id },
              data: {
                 status: 'FAILED',
                 errorMessage: error.message || 'Unknown error',
                 retryCount: certificate.retryCount + 1,
              }
           });
        }
        
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
