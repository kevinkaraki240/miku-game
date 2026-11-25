import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const keys = await prisma.gameKey.findMany({
    where: { status: 'SOLD', orderItem: { order: { userId: user.id, status: 'PAID' } } },
    orderBy: { id: 'desc' },
    include: {
      orderItem: { select: { title: true, platform: true, order: { select: { id: true, createdAt: true } } } },
    },
  });
  return ok(
    keys.map((k) => ({
      title: k.orderItem.title,
      platform: k.orderItem.platform,
      code: k.code,
      orderId: k.orderItem.order.id,
      purchasedAt: k.orderItem.order.createdAt,
    }))
  );
});