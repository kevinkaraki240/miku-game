import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireAdmin(request);
  const since = new Date(Date.now() - 14 * 86400000);

  const [paidOrders, byStatus, topGames, users, editions] = await Promise.all([
    prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: since } }, select: { totalVnd: true, createdAt: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true }, _sum: { totalVnd: true } }),
    prisma.orderItem.groupBy({
      by: ['title'],
      where: { order: { status: 'PAID' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.user.count(),
    prisma.edition.findMany({
      include: { game: { select: { title: true } }, _count: { select: { keys: { where: { status: 'AVAILABLE' } } } } },
    }),
  ]);

  // Doanh thu theo ngày (14 ngày gần nhất, theo giờ UTC)
  const revenueByDay = {};
  for (const o of paidOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] ?? 0) + o.totalVnd;
  }

  return ok({
    users,
    orders: byStatus.map((s) => ({ status: s.status, count: s._count._all, totalVnd: s._sum.totalVnd ?? 0 })),
    revenueByDay,
    topGames: topGames.map((g) => ({ title: g.title, sold: g._sum.quantity })),
    lowStock: editions
      .filter((e) => e._count.keys < 5)
      .map((e) => ({ editionId: e.id, title: e.game.title, platform: e.platform, keysLeft: e._count.keys })),
  });
});