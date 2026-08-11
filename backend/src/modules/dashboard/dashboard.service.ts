import { prisma } from '../../config/prisma';

export async function getSalesOverview() {
  const days = 7;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const challans = await prisma.challan.findMany({
    where: { status: 'CONFIRMED', confirmedAt: { gte: since } },
    include: { items: true },
  });

  const buckets: { date: string; label: string; total: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      total: 0,
    });
  }

  for (const challan of challans) {
    if (!challan.confirmedAt) continue;
    const dateKey = challan.confirmedAt.toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.date === dateKey);
    if (!bucket) continue;
    const value = challan.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
    bucket.total += value;
  }

  return buckets;
}