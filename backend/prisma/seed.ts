import { PrismaClient, Role, CustomerType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const roles: { name: string; email: string; role: Role }[] = [
    { name: 'Admin User', email: 'admin@mini-erp.test', role: 'ADMIN' },
    { name: 'Sales User', email: 'sales@mini-erp.test', role: 'SALES' },
    { name: 'Warehouse User', email: 'warehouse@mini-erp.test', role: 'WAREHOUSE' },
    { name: 'Accounts User', email: 'accounts@mini-erp.test', role: 'ACCOUNTS' },
  ];

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { name: r.name, email: r.email, passwordHash, role: r.role },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@mini-erp.test' } });

  await prisma.product.createMany({
    data: [
      { name: 'Keyboard', sku: 'KB001', category: 'Accessories', unitPrice: 800, currentStock: 42, minStock: 10, warehouse: 'WH-01' },
      { name: 'Mouse', sku: 'MS001', category: 'Accessories', unitPrice: 500, currentStock: 8, minStock: 15, warehouse: 'WH-01' },
      { name: 'Monitor', sku: 'MN001', category: 'Displays', unitPrice: 8000, currentStock: 21, minStock: 5, warehouse: 'WH-01' },
    ],
    skipDuplicates: true,
  });

  await prisma.customer.createMany({
    data: [
      { name: 'ABC Traders', mobile: '9876543210', customerType: CustomerType.WHOLESALE, status: 'ACTIVE', createdBy: admin.id },
      { name: 'XYZ Retail', mobile: '9876500000', customerType: CustomerType.RETAIL, status: 'LEAD', createdBy: admin.id } as any,
    ],
  });

  console.log('Seed complete. Test credentials: {role}@mini-erp.test / Password123!');
}

main().finally(() => prisma.$disconnect());