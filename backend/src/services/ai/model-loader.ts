import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { logger } from '../../utils/logger';

/**
 * Real MobileNetV2 model loader.
 * Downloads the model from TensorFlow Hub on first load (~13MB).
 * Uses TF.js CPU backend (pure JS, no native bindings needed).
 */

let model: mobilenet.MobileNet | null = null;
let isLoading = false;
let loadAttempted = false;

/**
 * Load MobileNetV2 for image classification.
 * - version 2 = MobileNetV2 (more accurate)
 * - alpha 1.0 = full-width model (most accurate, ~13MB)
 * 
 * First load downloads from Google CDN, subsequent loads use cached weights.
 */
export async function loadModel(): Promise<void> {
  if (model || isLoading) return;
  if (loadAttempted) {
    logger.warn('⚠️  Model load already attempted and failed. Skipping.');
    return;
  }

  isLoading = true;
  loadAttempted = true;

  try {
    logger.info('🧠 Loading MobileNetV2 model from TensorFlow Hub...');
    const startTime = Date.now();

    // Ensure CPU backend is initialized
    await tf.ready();
    logger.info(`   TF.js backend: ${tf.getBackend()}`);

    model = await mobilenet.load({
      version: 2,
      alpha: 1.0,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`✅ MobileNetV2 loaded successfully in ${elapsed}s`);
  } catch (err) {
    logger.error({ err }, '❌ Failed to load MobileNetV2 model');
    model = null;
  } finally {
    isLoading = false;
  }
}

/**
 * Get the loaded model instance. Returns null if not loaded.
 */
export function getModel(): mobilenet.MobileNet | null {
  return model;
}

/**
 * Check if the model is currently loaded and ready for inference.
 */
export function isModelLoaded(): boolean {
  return model !== null;
}
