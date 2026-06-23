import { env } from '../config/env';
import { logger } from '../utils/logger';
import { initCloudinary } from '../services/storage/cloudinary.service';
import { initBlockchain } from '../services/blockchain/polygon.service';
import { createAiValidationWorker } from './ai-validation.worker';
import { createCarbonScoreWorker } from './carbon-score.worker';
import { createBlockchainMintWorker } from './blockchain-mint.worker';
import { disconnectDatabase } from '../config/database';
import { disconnectRedis } from '../config/redis';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    password: parsed.password || undefined,
  };
}

async function startWorkers() {
  logger.info('Starting Tani Tinggi background workers...');

  initCloudinary();
  initBlockchain();

  const connection = parseRedisUrl(env.REDIS_URL);

  const aiWorker = createAiValidationWorker(connection);
  const carbonWorker = createCarbonScoreWorker(connection);
  const blockchainWorker = createBlockchainMintWorker(connection);

  logger.info('Workers started successfully');

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down workers...`);
    await Promise.all([
      aiWorker.close(),
      carbonWorker.close(),
      blockchainWorker.close(),
    ]);
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startWorkers().catch(error => {
  logger.error({ err: error }, 'Failed to start workers');
  process.exit(1);
});
