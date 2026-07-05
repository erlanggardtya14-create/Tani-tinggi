import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import { getModel, isModelLoaded, loadModel } from './model-loader';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AiValidationResult {
  isValidPlant: boolean;
  detectedClass: string;
  confidence: number;
  modelVersion: string;
  processingMs: number;
  rawResponse?: Record<string, unknown>;
}

// ─── Vegetable ↔ ImageNet Class Mapping ────────────────────────────────────────
// MobileNetV2 trained on ImageNet-1K has these food/vegetable classes.
// We map our Indonesian vegetable types to relevant ImageNet keywords.

const VEGETABLE_KEYWORDS: Record<string, string[]> = {
  'Selada':   ['head cabbage', 'cabbage', 'lettuce', 'leaf'],
  'Wortel':   ['carrot'],
  'Kentang':  ['potato', 'mashed potato', 'french loaf'],
  'Tomat':    ['tomato', 'strawberry'],  // ImageNet doesn't have 'tomato' directly, closest matches
  'Cabai':    ['bell pepper', 'pepper', 'hot pot', 'chili'],
  'Kangkung': ['spinach', 'leaf', 'herb'],
  'Bayam':    ['spinach', 'leaf', 'herb'],
  'Brokoli':  ['broccoli'],
  'Kol':      ['head cabbage', 'cabbage'],
  'Sawi':     ['head cabbage', 'cabbage', 'leaf'],
  'Buncis':   ['cucumber', 'zucchini', 'bean'],
  'Terong':   ['zucchini', 'cucumber', 'eggplant'],
  'Jagung':   ['corn', 'ear'],
  'Bawang':   ['onion', 'garlic', 'mushroom'],
};

// General plant/food ImageNet keywords that indicate a valid agricultural product
const PLANT_KEYWORDS = [
  'broccoli', 'cauliflower', 'cucumber', 'bell pepper', 'mushroom',
  'zucchini', 'artichoke', 'head cabbage', 'cardoon', 'spaghetti squash',
  'acorn squash', 'butternut squash', 'corn', 'ear', 'leaf',
  'strawberry', 'banana', 'orange', 'lemon', 'pineapple', 'fig',
  'jackfruit', 'pomegranate', 'Granny Smith', 'custard apple',
  'grocery store', 'greengrocer', 'hay', 'potpie',
  'plate', 'tray', 'bowl', 'pot', 'caldron',
  'spinach', 'carrot', 'potato',
];

// Things that are definitely NOT vegetables
const REJECTED_KEYWORDS = [
  'person', 'face', 'laptop', 'phone', 'car', 'dog', 'cat',
  'building', 'text', 'screen', 'desk', 'chair', 'monitor',
];

// ─── Main Validation Function ──────────────────────────────────────────────────

/**
 * Validate a plant image using MobileNetV2 AI inference.
 *
 * Pipeline:
 * 1. Download image from URL
 * 2. Preprocess with sharp (resize to 224×224 RGB)
 * 3. Create tf.Tensor3D
 * 4. Run MobileNetV2 inference → top-10 predictions
 * 5. Match predictions against vegetable type keywords
 * 6. Return structured validation result
 *
 * Falls back to rule-based validation if model fails to load.
 */
export async function validatePlantImage(
  imageUrl: string | null,
  vegetableType: string,
  imageHash: string | null
): Promise<AiValidationResult> {
  const start = Date.now();

  // Ensure model is loaded (first call downloads ~13MB from TF Hub)
  if (!isModelLoaded()) {
    await loadModel();
  }

  const model = getModel();

  // If model failed to load or no image URL, fall back to rules
  if (!model) {
    logger.warn('⚠️  MobileNetV2 not available. Using rule-based fallback.');
    return ruleBasedFallback(vegetableType, imageUrl, imageHash, start);
  }

  if (!imageUrl) {
    logger.warn('⚠️  No image URL provided. Using rule-based fallback.');
    return ruleBasedFallback(vegetableType, imageUrl, imageHash, start);
  }

  // Detect mock/placeholder Cloudinary URLs — skip download, use rules directly
  const isMockUrl = imageUrl.includes('/mock/') || imageUrl.includes('mock-image');
  if (isMockUrl) {
    logger.info('📋 Mock image URL detected (no real Cloudinary). Using rule-based validation.');
    return ruleBasedFallback(vegetableType, imageUrl, imageHash, start);
  }

  try {
    // ── Step 1: Download image ──────────────────────────────────────────
    logger.info({ imageUrl }, '📸 Downloading image for AI validation...');
    const imageBuffer = await downloadImage(imageUrl);
    logger.info(`   Image downloaded: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

    // ── Step 2: Preprocess with sharp ───────────────────────────────────
    // MobileNetV2 expects 224×224 RGB pixels
    const { data } = await sharp(imageBuffer)
      .resize(224, 224, { fit: 'cover', position: 'centre' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // ── Step 3: Create tensor ───────────────────────────────────────────
    // model.classify() expects pixel values 0-255 (it normalizes internally)
    const tensor = tf.tensor3d(new Uint8Array(data), [224, 224, 3]);

    // ── Step 4: Run inference ───────────────────────────────────────────
    logger.info('🤖 Running MobileNetV2 inference...');
    const predictions = await model.classify(tensor, 10);

    // Clean up tensor to prevent memory leak
    tensor.dispose();

    if (predictions.length === 0) {
      logger.warn('No predictions returned from model');
      return ruleBasedFallback(vegetableType, imageUrl, imageHash, start);
    }

    // ── Step 5: Analyze results ─────────────────────────────────────────
    const topPrediction = predictions[0];
    const detectedClass = topPrediction.className;
    const confidence = topPrediction.probability;

    // Check if any prediction matches the claimed vegetable type
    const isVegetableMatch = checkVegetableMatch(predictions, vegetableType);

    // Check if any prediction is plant/food-like
    const isPlantLike = predictions.some((p) =>
      PLANT_KEYWORDS.some((kw) =>
        p.className.toLowerCase().includes(kw.toLowerCase())
      )
    );

    // Check if prediction is definitely NOT a plant (person, laptop, etc.)
    const isRejected = predictions.slice(0, 3).some((p) =>
      REJECTED_KEYWORDS.some((kw) =>
        p.className.toLowerCase().includes(kw.toLowerCase())
      )
    );

    // Final decision: valid if matches vegetable OR is plant-like, AND not rejected
    const isValidPlant =
      !isRejected &&
      (isVegetableMatch || isPlantLike) &&
      confidence > (env.AI_CONFIDENCE_THRESHOLD * 0.5); // More lenient since ImageNet classes don't perfectly map

    const processingMs = Date.now() - start;
    logger.info({
      detectedClass,
      confidence: (confidence * 100).toFixed(1) + '%',
      isVegetableMatch,
      isPlantLike,
      isRejected,
      isValidPlant,
      processingMs: processingMs + 'ms',
    }, '🧠 AI validation result');

    return {
      isValidPlant,
      detectedClass,
      confidence: Math.round(confidence * 1000) / 1000,
      modelVersion: 'mobilenetv2-1.0-224',
      processingMs,
      rawResponse: {
        top5: predictions.slice(0, 5).map((p) => ({
          class: p.className,
          probability: Math.round(p.probability * 1000) / 1000,
        })),
        analysis: {
          isVegetableMatch,
          isPlantLike,
          isRejected,
          claimedType: vegetableType,
        },
      },
    };
  } catch (err) {
    logger.error({ err, imageUrl }, '❌ AI inference failed, falling back to rules');
    return ruleBasedFallback(vegetableType, imageUrl, imageHash, start);
  }
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Check if any of the model's predictions match the claimed vegetable type.
 */
function checkVegetableMatch(
  predictions: Array<{ className: string; probability: number }>,
  vegetableType: string
): boolean {
  const keywords = VEGETABLE_KEYWORDS[vegetableType];
  if (!keywords) return false;

  return predictions.some((pred) =>
    keywords.some((kw) =>
      pred.className.toLowerCase().includes(kw.toLowerCase())
    )
  );
}

/**
 * Download an image from a URL and return its buffer.
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TaniTinggi-AI-Validator/1.0',
    },
    signal: AbortSignal.timeout(15000), // 15s timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    logger.warn({ contentType }, 'Response is not an image, proceeding anyway');
  }

  return Buffer.from(await response.arrayBuffer());
}

// ─── Rule-Based Fallback ───────────────────────────────────────────────────────

/**
 * Fallback validation when MobileNetV2 is unavailable.
 * Uses simple heuristics: valid vegetable name + image present = pass.
 */
function ruleBasedFallback(
  vegetableType: string,
  imageUrl: string | null,
  _imageHash: string | null,
  startTime: number
): AiValidationResult {
  const VALID_VEGETABLES = [
    'Selada', 'Wortel', 'Kentang', 'Tomat', 'Cabai', 'Kangkung',
    'Bayam', 'Brokoli', 'Kol', 'Sawi', 'Buncis', 'Terong',
    'Jagung', 'Bawang', 'Other_Vegetable',
  ];

  let isValidPlant = false;
  let confidence = 0.4;
  let detectedClass = 'Unknown';

  if (VALID_VEGETABLES.includes(vegetableType)) {
    detectedClass = vegetableType;
    if (imageUrl) {
      isValidPlant = true;
      confidence = 0.85;
    }
  }

  return {
    isValidPlant,
    detectedClass,
    confidence,
    modelVersion: 'rule-based-fallback-' + env.AI_MODEL_VERSION,
    processingMs: Date.now() - startTime,
    rawResponse: { note: 'Rule-based fallback (MobileNetV2 model not available)' },
  };
}
