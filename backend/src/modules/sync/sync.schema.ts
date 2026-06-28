import { z } from 'zod';

const deliveryInputSchema = z.object({
  distanceKm: z.number().positive(),
  vehicleType: z.enum(['MOTORCYCLE', 'PICKUP_TRUCK', 'MEDIUM_TRUCK', 'HEAVY_TRUCK', 'ELECTRIC_VEHICLE']),
  vehicleCapacity: z.number().positive().optional(),
  destinationCity: z.string().min(1),
  deliveryDate: z.string().datetime().optional(),
});

const syncRecordSchema = z.object({
  localId: z.string().uuid(),
  vegetableType: z.string().min(1),
  vegetableWeight: z.number().positive(),
  fertilizerType: z.enum(['ORGANIC_COMPOST', 'ORGANIC_MANURE', 'ORGANIC_LIQUID', 'CHEMICAL_UREA', 'CHEMICAL_NPK', 'NONE']),
  fertilizerBrand: z.string().optional(),
  pesticidesUsed: z.boolean(),
  imageBase64: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageHash: z.string().min(1),
  capturedAt: z.string().datetime(),
  delivery: deliveryInputSchema,
});

export const syncBatchSchema = z.object({
  deviceId: z.string().min(1),
  syncedAt: z.string().datetime(),
  records: z.array(syncRecordSchema).min(1).max(50),
});

export type SyncBatchInput = z.infer<typeof syncBatchSchema>;
export type SyncRecordInput = z.infer<typeof syncRecordSchema>;
