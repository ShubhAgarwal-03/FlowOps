import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { Prisma } from '@prisma/client';

export async function listProducts(params: {
  search?: string;
  category?: string;
  lowStock?: boolean;
  page: number;
  limit: number;
}) {
  const where: Prisma.ProductWhereInput = {
    ...(params.category ? { category: params.category } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { sku: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  let items = await prisma.product.findMany({
    where,
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    orderBy: { name: 'asc' },
  });
  const total = await prisma.product.count({ where });

  if (params.lowStock) {
    items = items.filter((p) => p.currentStock <= p.minStock);
  }

  return { items, total, page: params.page, limit: params.limit };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function createProduct(data: any) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw ApiError.conflict('SKU already exists');
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: any) {
  await getProduct(id);
  return prisma.product.update({ where: { id }, data });
}