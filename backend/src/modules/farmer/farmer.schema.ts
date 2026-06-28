import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  farmName: z.string().optional(),
  farmLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  altitude: z.number().int().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
