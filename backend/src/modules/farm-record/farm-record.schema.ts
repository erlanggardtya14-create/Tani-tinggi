import { z } from 'zod';

export const listRecordsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['PENDING', 'AI_VALIDATING', 'AI_REJECTED', 'CALCULATING', 'CERTIFYING', 'CERTIFIED', 'FAILED']).optional(),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
