// ──────────────────────────────────────────────────────────────────────────
// API client untuk Tani Tinggi backend (Fastify @ /api/v1)
//
// Semua response backend dibungkus { success, data, error, meta }.
// Helper di file ini meng-unwrap `data` dan menormalisasi error.
//
// Auth: frontend punya layar login/register sendiri (AuthScreen). Token JWT
// disimpan di localStorage. Saat request kena 401, token dibersihkan dan
// onUnauthorized() dipanggil agar app kembali ke layar login.
// Kredensial demo (VITE_DEMO_*) hanya untuk meng-isi awal form login.
// ──────────────────────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';
export const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'dieng@tanitinggi.id';
export const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ?? 'Farmer1234!';

const ACCESS_KEY = 'tt_access_token';
const REFRESH_KEY = 'tt_refresh_token';

// ─── Tipe domain (subset dari schema Prisma backend) ────────────────────────

export type RecordStatus =
  | 'PENDING'
  | 'AI_VALIDATING'
  | 'AI_REJECTED'
  | 'CALCULATING'
  | 'CERTIFYING'
  | 'CERTIFIED'
  | 'FAILED';

export type FertilizerType =
  | 'ORGANIC_COMPOST'
  | 'ORGANIC_MANURE'
  | 'ORGANIC_LIQUID'
  | 'CHEMICAL_UREA'
  | 'CHEMICAL_NPK'
  | 'NONE';

export type VehicleType =
  | 'MOTORCYCLE'
  | 'PICKUP_TRUCK'
  | 'MEDIUM_TRUCK'
  | 'HEAVY_TRUCK'
  | 'ELECTRIC_VEHICLE';

export interface CarbonScore {
  ecoGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  ecoScore: number;
  totalCarbonKg: number;
}

export interface Certificate {
  id: string;
  tokenId: string | null;
  txHash: string | null;
  contractAddress: string | null;
  chainId: number;
  qrCodeUrl: string | null;
  qrCodeData: string | null;
  status: 'PENDING' | 'MINTING' | 'MINTED' | 'FAILED';
  issuedAt: string | null;
  errorMessage: string | null;
}

export interface AiValidation {
  isValidPlant: boolean;
  detectedClass: string | null;
  confidence: number;
}

export interface DeliveryInfo {
  distanceKm: number;
  vehicleType: VehicleType;
  destinationCity: string;
}

export interface FarmRecord {
  id: string;
  vegetableType: string;
  vegetableWeight: number;
  fertilizerType: FertilizerType;
  pesticidesUsed: boolean;
  imageUrl: string | null;
  status: RecordStatus;
  capturedAt: string;
  createdAt: string;
  aiValidation?: AiValidation | null;
  carbonScore?: CarbonScore | null;
  certificate?: Certificate | null;
  deliveryInfo?: DeliveryInfo | null;
}

export interface FarmerProfile {
  id: string;
  email: string;
  role: string;
  farmer: {
    fullName: string;
    farmName: string;
    farmLocation: string;
    altitude: number | null;
  } | null;
}

export interface ScanInput {
  vegetableType: string;
  vegetableWeight: number;
  fertilizerType: FertilizerType;
  pesticidesUsed: boolean;
  distanceKm: number;
  vehicleType: VehicleType;
  destinationCity: string;
  imageBase64?: string; // data URI hasil upload
  imageUrl?: string; // dipakai bila tidak ada file
  imageHash: string;
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);

function setTokens(access: string, refresh: string): void {
  accessToken = access;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

// Dipanggil saat sesi tidak valid (401) → app kembali ke layar login.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

// ─── Low-level fetch ────────────────────────────────────────────────────────

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
}

async function parseJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  if (auth && !accessToken) {
    onUnauthorized?.();
    throw new ApiError('Silakan masuk terlebih dahulu.', 401, 'NO_AUTH');
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      'Tidak dapat terhubung ke server. Pastikan backend berjalan di port 3000.',
      0,
      'NETWORK_ERROR',
      err,
    );
  }

  // Sesi tidak valid / kedaluwarsa → bersihkan token & kembali ke layar login.
  if (res.status === 401 && auth) {
    clearTokens();
    profileCache = null;
    onUnauthorized?.();
    throw new ApiError('Sesi berakhir. Silakan masuk kembali.', 401, 'SESSION_EXPIRED');
  }

  const json = await parseJson(res);

  if (!res.ok || (json && json.success === false)) {
    const message = json?.error?.message ?? res.statusText ?? 'Permintaan gagal';
    throw new ApiError(message, res.status, json?.error?.code, json?.error?.details);
  }

  return (json?.data ?? json) as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  role: 'FARMER' | 'BUYER';
  fullName?: string;
  farmName?: string;
  farmLocation?: string;
}

let profileCache: FarmerProfile | null = null;

export async function login(email: string, password: string): Promise<FarmerProfile> {
  const data = await request<{ accessToken: string; refreshToken: string }>(
    '/auth/login',
    { method: 'POST', body: { email, password }, auth: false },
  );
  setTokens(data.accessToken, data.refreshToken);
  profileCache = null;
  return getProfile();
}

/** Daftar akun baru lalu langsung login (backend tidak auto-login saat register). */
export async function register(input: RegisterInput): Promise<FarmerProfile> {
  await request('/auth/register', { method: 'POST', body: input, auth: false });
  return login(input.email, input.password);
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  try {
    if (refreshToken) {
      await request('/auth/logout', { method: 'POST', body: { refreshToken } });
    }
  } catch {
    // abaikan error logout — yang penting token lokal dibersihkan.
  }
  clearTokens();
  profileCache = null;
}

export async function getProfile(): Promise<FarmerProfile> {
  if (profileCache) return profileCache;
  profileCache = await request<FarmerProfile>('/auth/me');
  return profileCache;
}

// ─── Sync (scan) ────────────────────────────────────────────────────────────

interface SyncRecordResult {
  localId: string;
  recordId?: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  reason?: string;
}

interface SyncResult {
  syncId: string;
  success: SyncRecordResult[];
  failed: SyncRecordResult[];
  skipped: SyncRecordResult[];
}

/**
 * Kirim satu hasil scan ke backend sebagai batch sync berisi 1 record.
 * Mengembalikan recordId untuk di-poll statusnya.
 */
export async function submitScan(input: ScanInput): Promise<string> {
  const localId = crypto.randomUUID();
  const payload = {
    deviceId: `web-${navigator.platform || 'browser'}`,
    syncedAt: new Date().toISOString(),
    records: [
      {
        localId,
        vegetableType: input.vegetableType,
        vegetableWeight: input.vegetableWeight,
        fertilizerType: input.fertilizerType,
        pesticidesUsed: input.pesticidesUsed,
        imageBase64: input.imageBase64,
        imageUrl: input.imageUrl,
        imageHash: input.imageHash,
        capturedAt: new Date().toISOString(),
        delivery: {
          distanceKm: input.distanceKm,
          vehicleType: input.vehicleType,
          destinationCity: input.destinationCity,
        },
      },
    ],
  };

  const result = await request<SyncResult>('/sync', { method: 'POST', body: payload });

  const ok = result.success.find((r) => r.recordId);
  if (ok?.recordId) return ok.recordId;

  const reason =
    result.failed[0]?.reason ?? result.skipped[0]?.reason ?? 'Data tidak dapat diproses server.';
  throw new ApiError(reason, 422, 'SYNC_FAILED', result);
}

// ─── Records ─────────────────────────────────────────────────────────────

export async function getRecord(id: string): Promise<FarmRecord> {
  return request<FarmRecord>(`/records/${id}`);
}

export interface RecordListResult {
  data: FarmRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listCertified(limit = 10): Promise<RecordListResult> {
  return request<RecordListResult>(`/records?status=CERTIFIED&limit=${limit}`);
}

const TERMINAL: RecordStatus[] = ['CERTIFIED', 'AI_REJECTED', 'FAILED'];

/**
 * Poll detail record sampai status terminal (CERTIFIED / AI_REJECTED / FAILED).
 * Pipeline backend (AI → carbon → blockchain) berjalan async di worker.
 */
export async function pollRecord(
  id: string,
  opts: { intervalMs?: number; maxAttempts?: number; onTick?: (r: FarmRecord) => void } = {},
): Promise<FarmRecord> {
  const { intervalMs = 2500, maxAttempts = 40, onTick } = opts;
  let last: FarmRecord | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const record = await getRecord(id);
    last = record;
    onTick?.(record);
    if (TERMINAL.includes(record.status)) return record;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new ApiError(
    'Proses validasi belum selesai (timeout). Pastikan worker backend berjalan (npm run dev:worker).',
    408,
    'POLL_TIMEOUT',
    last,
  );
}

/** CERTIFIED → aman; selain itu (AI_REJECTED/FAILED) → tidak aman. */
export function statusToMode(status: RecordStatus): 'safe' | 'unsafe' {
  return status === 'CERTIFIED' ? 'safe' : 'unsafe';
}
