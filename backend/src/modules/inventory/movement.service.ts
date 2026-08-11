import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';

export async function listMovements(params: {
  productId?: string;
  movementType?: 'IN' | 'OUT';
  page: number;
  limit: number;
}) {
  const where = {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.movementType ? { movementType: params.movementType } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { items, total, page: params.page, limit: params.limit };
}

export async function stockIn(productId: string, quantity: number, reason: string, createdBy: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound('Product not found');

    const updated = await tx.product.update({
      where: { id: productId },
      data: { currentStock: { increment: quantity } },
    });

    const movement = await tx.stockMovement.create({
      data: { productId, quantityChanged: quantity, movementType: 'IN', reason, createdBy },
    });

    return { product: updated, movement };
  });
}