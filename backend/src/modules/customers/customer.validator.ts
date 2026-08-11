import { z } from 'zod';

export const customerBody = z.object({
  name: z.string().min(1),
  mobile: z.string().min(6),
  email: z.string().email().optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({ body: customerBody });
export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: customerBody.partial(),
});
export const getCustomerSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listCustomersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const addFollowupSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    note: z.string().min(1),
    followUpDate: z.coerce.date().optional(),
  }),
});