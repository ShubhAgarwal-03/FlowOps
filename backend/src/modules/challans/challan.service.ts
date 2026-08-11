import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';

async function nextChallanNumber(tx: any): Promise<string> {
  const counter = await tx.counter.upsert({
    where: { id: 'challan' },
    update: { value: { increment: 1 } },
    create: { id: 'challan', value: 1 },
  });
  return `CH-${String(counter.value).padStart(6, '0')}`;
}

export async function listChallans(params: {
  status?: string;
  customerId?: string;
  page: number;
  limit: number;
}) {
  const where = {
    ...(params.status ? { status: params.status as any } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      include: { customer: { select: { name: true } } },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.challan.count({ where }),
  ]);

  return { items, total, page: params.page, limit: params.limit };
}

export async function getChallan(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { customer: true, items: true, creator: { select: { name: true } } },
  });
  if (!challan) throw ApiError.notFound('Challan not found');
  return challan;
}

// items are stored as snapshots the moment the draft is created/edited —
// price/name changes on Product later never retroactively change a challan
export async function createChallan(customerId: string, items: { productId: string; quantity: number }[], createdBy: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw ApiError.badRequest('Customer not found');

    const products = await tx.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
    if (products.length !== items.length) throw ApiError.badRequest('One or more products not found');

    const challanNumber = await nextChallanNumber(tx);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    return tx.challan.create({
      data: {
        challanNumber,
        customerId,
        createdBy,
        totalQuantity,
        items: {
          create: items.map((i) => {
            const product = products.find((p) => p.id === i.productId)!;
            return {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              unitPrice: product.unitPrice,
              quantity: i.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });
  });
}

export async function updateChallan(id: string, data: { customerId?: string; items?: { productId: string; quantity: number }[] }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Challan not found');
    if (existing.status !== 'DRAFT') throw ApiError.conflict('Only DRAFT challans can be edited');

    if (data.items) {
      const products = await tx.product.findMany({ where: { id: { in: data.items.map((i) => i.productId) } } });
      if (products.length !== data.items.length) throw ApiError.badRequest('One or more products not found');

      await tx.challanItem.deleteMany({ where: { challanId: id } });
      await tx.challanItem.createMany({
        data: data.items.map((i) => {
          const product = products.find((p) => p.id === i.productId)!;
          return {
            challanId: id,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice: product.unitPrice,
            quantity: i.quantity,
          };
        }),
      });
    }

    return tx.challan.update({
      where: { id },
      data: {
        ...(data.customerId ? { customerId: data.customerId } : {}),
        ...(data.items ? { totalQuantity: data.items.reduce((s, i) => s + i.quantity, 0) } : {}),
      },
      include: { items: true },
    });
  });
}

// the core business rule: validate stock, deduct atomically, log movements, lock the challan
export async function confirmChallan(id: string, confirmedBy: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound('Challan not found');
    if (challan.status !== 'DRAFT') throw ApiError.conflict(`Challan is already ${challan.status}`);

    for (const item of challan.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw ApiError.badRequest(`Product ${item.productName} no longer exists`);
      if (product.currentStock < item.quantity) {
        throw ApiError.conflict(
          `Insufficient stock for ${product.name}: have ${product.currentStock}, need ${item.quantity}`,
          { productId: product.id, available: product.currentStock, requested: item.quantity }
        );
      }
    }

    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: -item.quantity,
          movementType: 'OUT',
          reason: challan.challanNumber,
          referenceId: challan.id,
          createdBy: confirmedBy,
        },
      });
    }

    return tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}