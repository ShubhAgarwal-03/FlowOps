import { z } from 'zod';

const lineItem = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(lineItem).min(1),
  }),
});

export const updateChallanSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(lineItem).min(1).optional(),
  }),
});

export const getChallanSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const confirmChallanSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listChallansSchema = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    customerId: z.string().uuid().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});