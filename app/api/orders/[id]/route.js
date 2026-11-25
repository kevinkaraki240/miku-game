import { prisma } from '@/lib/db';
import { handle, ok, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { expireStaleOrders } from '@/lib/orders';

export const GET = handle(async (request, { params }) => {
  const user = await requireUser(request);
  const id = Number((await params).id);
  await expireStaleOrders();

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { payment: true, items: { include: { keys: { select: { code: true } } } } },
  });
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.status !== 'PAID') order.items.forEach((i) => (i.keys = []));
  return ok(order);
});