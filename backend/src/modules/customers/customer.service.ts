import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { Prisma } from '@prisma/client';

export async function listCustomers(params: {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.CustomerWhereInput = {
    ...(params.status ? { status: params.status as any } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { businessName: { contains: params.search, mode: 'insensitive' } },
            { mobile: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page: params.page, limit: params.limit };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { followups: { orderBy: { createdAt: 'desc' } } },
  });
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}

export async function createCustomer(data: any, createdBy: string) {
  return prisma.customer.create({ data: { ...data, createdBy } });
}

export async function updateCustomer(id: string, data: any) {
  await getCustomer(id); // 404s if missing
  return prisma.customer.update({ where: { id }, data });
}

export async function addFollowup(customerId: string, note: string, followUpDate: Date | undefined, createdBy: string) {
  await getCustomer(customerId);
  return prisma.$transaction(async (tx) => {
    const followup = await tx.customerFollowup.create({
      data: { customerId, note, followUpDate, createdBy },
    });
    if (followUpDate) {
      await tx.customer.update({ where: { id: customerId }, data: { followUpDate } });
    }
    return followup;
  });
}