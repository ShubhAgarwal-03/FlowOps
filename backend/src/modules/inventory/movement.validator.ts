import { z } from 'zod';

export const listMovementsSchema = z.object({
  query: z.object({
    productId: z.string().uuid().optional(),
    movementType: z.enum(['IN', 'OUT']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const stockInSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    reason: z.string().min(1),
  }),
});