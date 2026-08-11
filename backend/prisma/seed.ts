import { PrismaClient, Role, CustomerType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function nextChallanNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: 'challan' },
    update: { value: { increment: 1 } },
    create: { id: 'challan', value: 1 },
  });
  return `CH-${String(counter.value).padStart(6, '0')}`;
}

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const roles: { name: string; email: string; role: Role }[] = [
    { name: 'Admin User', email: 'admin@mini-erp.test', role: 'ADMIN' },
    { name: 'Sales User', email: 'sales@mini-erp.test', role: 'SALES' },
    { name: 'Warehouse User', email: 'warehouse@mini-erp.test', role: 'WAREHOUSE' },
    { name: 'Accounts User', email: 'accounts@mini-erp.test', role: 'ACCOUNTS' },
  ];
  for (const r of roles) {
    await prisma.user.upsert({ where: { email: r.email }, update: {}, create: { ...r, passwordHash } });
  }
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@mini-erp.test' } });
  const sales = await prisma.user.findUniqueOrThrow({ where: { email: 'sales@mini-erp.test' } });

  await prisma.product.createMany({
    data: [
      { name: 'Keyboard', sku: 'KB001', category: 'Accessories', unitPrice: 800, currentStock: 42, minStock: 10, warehouse: 'WH-01' },
      { name: 'Mouse', sku: 'MS001', category: 'Accessories', unitPrice: 500, currentStock: 8, minStock: 15, warehouse: 'WH-01' },
      { name: 'Monitor', sku: 'MN001', category: 'Displays', unitPrice: 8000, currentStock: 21, minStock: 5, warehouse: 'WH-01' },
      { name: 'USB-C Hub', sku: 'HB001', category: 'Accessories', unitPrice: 1200, currentStock: 30, minStock: 10, warehouse: 'WH-01' },
    ],
    skipDuplicates: true,
  });
  const keyboard = await prisma.product.findUniqueOrThrow({ where: { sku: 'KB001' } });
  const monitor = await prisma.product.findUniqueOrThrow({ where: { sku: 'MN001' } });
  const hub = await prisma.product.findUniqueOrThrow({ where: { sku: 'HB001' } });

  await prisma.customer.createMany({
    data: [
      { name: 'ABC Traders', mobile: '9876543210', customerType: CustomerType.WHOLESALE, status: 'ACTIVE', createdBy: admin.id },
      { name: 'XYZ Retail', mobile: '9876500000', customerType: CustomerType.RETAIL, status: 'LEAD', createdBy: admin.id },
    ],
    skipDuplicates: true,
  });
  const abc = await prisma.customer.findFirstOrThrow({ where: { name: 'ABC Traders' } });

  // demo confirmed challans spread across the last 7 days, so the dashboard chart isn't empty
  const demoOrders = [
    { daysAgo: 6, product: keyboard, qty: 3 },
    { daysAgo: 5, product: hub, qty: 4 },
    { daysAgo: 4, product: monitor, qty: 1 },
    { daysAgo: 3, product: keyboard, qty: 2 },
    { daysAgo: 2, product: hub, qty: 5 },
    { daysAgo: 1, product: monitor, qty: 2 },
    { daysAgo: 0, product: keyboard, qty: 4 },
  ];

  for (const order of demoOrders) {
    const confirmedAt = new Date();
    confirmedAt.setDate(confirmedAt.getDate() - order.daysAgo);

    const challanNumber = await nextChallanNumber();
    await prisma.challan.create({
      data: {
        challanNumber,
        customerId: abc.id,
        createdBy: sales.id,
        status: 'CONFIRMED',
        totalQuantity: order.qty,
        createdAt: confirmedAt,
        confirmedAt,
        items: {
          create: [{
            productId: order.product.id,
            productName: order.product.name,
            sku: order.product.sku,
            unitPrice: order.product.unitPrice,
            quantity: order.qty,
          }],
        },
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: order.product.id,
        quantityChanged: -order.qty,
        movementType: 'OUT',
        reason: challanNumber,
        referenceId: challanNumber,
        createdBy: sales.id,
        createdAt: confirmedAt,
      },
    });
  }

  console.log('Seed complete. Test credentials: {role}@mini-erp.test / Password123!');
}

main().finally(() => prisma.$disconnect());