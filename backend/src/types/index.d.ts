import { FastifyRequest, FastifyReply } from 'fastify';

// ─── Global Augmentations ─────────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user from JWT */
    currentUser?: JwtPayload;
  }
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  farmerId?: string;
  iat?: number;
  exp?: number;
}

export interface JwtTokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncRecordInput {
  localId: string;
  vegetableType: string;
  vegetableWeight: number;
  fertilizerType: string;
  fertilizerBrand?: string;
  pesticidesUsed: boolean;
  imageBase64?: string;
  imageUrl?: string;
  imageHash: string;
  capturedAt: string;
  delivery: {
    distanceKm: number;
    vehicleType: string;
    vehicleCapacity?: number;
    destinationCity: string;
    deliveryDate?: string;
  };
}

export interface SyncBatchInput {
  deviceId: string;
  syncedAt: string;
  records: SyncRecordInput[];
}

export interface SyncResult {
  syncId: string;
  success: SyncRecordResult[];
  failed: SyncRecordResult[];
  skipped: SyncRecordResult[];
}

export interface SyncRecordResult {
  localId: string;
  recordId?: string;
  status: string;
  reason?: string;
}

// ─── Carbon Score ─────────────────────────────────────────────────────────────

export interface CarbonCalculationInput {
  distanceKm: number;
  weightKg: number;
  vehicleType: string;
  fertilizerType: string;
  pesticidesUsed: boolean;
}

export interface CarbonCalculationResult {
  rawCarbonKg: number;
  fertilizerPenalty: number;
  pesticidePenalty: number;
  totalCarbonKg: number;
  ecoScore: number;
  ecoGrade: string;
  calculationVersion: string;
}

// ─── AI Validation ────────────────────────────────────────────────────────────

export interface AiValidationResult {
  isValidPlant: boolean;
  detectedClass: string;
  confidence: number;
  modelVersion: string;
  processingMs: number;
  rawResponse?: Record<string, unknown>;
}

// ─── QR Code ──────────────────────────────────────────────────────────────────

export interface QrCertificatePayload {
  certId: string;
  farmRecordId: string;
  txHash: string;
  tokenId: string;
  ecoGrade: string;
  ecoScore: number;
  vegetableType: string;
  farmName: string;
  farmerName: string;
  issuedAt: number;
  exp: number;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  uptime: number;
  version: string;
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    blockchain: boolean;
  };
}
