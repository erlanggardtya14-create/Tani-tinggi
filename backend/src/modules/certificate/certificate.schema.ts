import { z } from 'zod';

export const qrTokenParam = z.object({
  qrToken: z.string(),
});

export const certificateIdParam = z.object({
  id: z.string(),
});

export const txHashParam = z.object({
  txHash: z.string(),
});

export const retryParam = z.object({
  recordId: z.string(),
});
