import { z } from 'zod';

export const productBody = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional(),
  unitPrice: z.coerce.number().positive(),
  currentStock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  warehouse: z.string().optional(),
});

export const createProductSchema = z.object({ body: productBody });
export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: productBody.partial(),
});
export const getProductSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    lowStock: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});