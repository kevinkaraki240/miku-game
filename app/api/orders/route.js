import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { createOrderFromCart, expireStaleOrders } from '@/lib/orders';

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  await expireStaleOrders();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    include: { items: true, payment: { select: { method: true, status: true } } },
  });
  return ok(orders);
});

// Frontend luôn gửi body JSON, ví dụ {} hoặc {"couponCode":"MIKU10"}
export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { couponCode } = await body(request, z.object({ couponCode: z.string().trim().max(30).optional() }));
  const o = await createOrderFromCart(user, couponCode);
  return ok(
    { id: o.id, status: o.status, subtotalVnd: o.subtotalVnd, discountVnd: o.discountVnd, totalVnd: o.totalVnd, expiresAt: o.expiresAt },
    201
  );
});