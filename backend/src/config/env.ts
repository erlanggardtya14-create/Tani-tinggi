import { config } from 'dotenv';
config();
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Zod-validated environment configuration.
 * Fails fast on startup if required env vars are missing or malformed.
 * All env vars are typed and documented.
 */
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // JWT (RSA keys)
  JWT_PRIVATE_KEY_PATH: z.string().default('./keys/private.pem'),
  JWT_PUBLIC_KEY_PATH: z.string().default('./keys/public.pem'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // AI
  TF_MODEL_PATH: z.string().default('./models/plant_validator/model.json'),
  TF_MODEL_URL: z.string().url().optional(),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
  AI_MODEL_VERSION: z.string().default('1.0.0'),

  // Blockchain
  POLYGON_RPC_URL: z.string().default('https://rpc-amoy.polygon.technology'),
  POLYGON_PRIVATE_KEY: z.string().default(''),
  CONTRACT_ADDRESS: z.string().default(''),
  CHAIN_ID: z.coerce.number().int().default(80002),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('tanitinggi'),

  // Carbon Score
  CARBON_CALCULATION_VERSION: z.string().default('1.0.0'),
  EMISSION_MOTORCYCLE: z.coerce.number().default(0.000103),
  EMISSION_PICKUP: z.coerce.number().default(0.000097),
  EMISSION_MEDIUM_TRUCK: z.coerce.number().default(0.000072),
  EMISSION_HEAVY_TRUCK: z.coerce.number().default(0.000062),
  EMISSION_ELECTRIC: z.coerce.number().default(0.000015),
  GRADE_A_MAX_KG: z.coerce.number().default(2.0),
  GRADE_B_MAX_KG: z.coerce.number().default(5.0),
  GRADE_C_MAX_KG: z.coerce.number().default(10.0),
  GRADE_D_MAX_KG: z.coerce.number().default(20.0),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Throws a descriptive error if validation fails.
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('❌ Invalid environment variables:\n' + formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();

/**
 * Load RSA keys for JWT RS256 signing.
 * Falls back to HMAC HS256 with a random secret in development if keys don't exist.
 */
export function loadJwtKeys(): { privateKey: string; publicKey: string } | null {
  const privatePath = resolve(env.JWT_PRIVATE_KEY_PATH);
  const publicPath = resolve(env.JWT_PUBLIC_KEY_PATH);

  if (!existsSync(privatePath) || !existsSync(publicPath)) {
    if (env.NODE_ENV === 'production') {
      console.error('❌ JWT RSA keys not found. Run: npm run generate:keys');
      process.exit(1);
    }
    // Dev fallback: return null, auth module will use HMAC
    console.warn('⚠️  JWT RSA keys not found. Using HMAC fallback for development.');
    return null;
  }

  return {
    privateKey: readFileSync(privatePath, 'utf-8'),
    publicKey: readFileSync(publicPath, 'utf-8'),
  };
}

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
