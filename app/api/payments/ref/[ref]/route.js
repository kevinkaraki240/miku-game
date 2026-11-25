import { prisma } from '@/lib/db';
import { handle, ok, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { expireStaleOrders } from '@/lib/orders';

export const GET = handle(async (request, { params }) => {
  const user = await requireUser(request);
  const { ref } = await params;
  await expireStaleOrders();

  const p = await prisma.payment.findUnique({ where: { providerRef: ref }, include: { order: true } });
  if (!p || p.order.userId !== user.id) throw new HttpError(404, 'Không tìm thấy giao dịch');

  return ok({
    providerRef: p.providerRef,
    method: p.method,
    status: p.status,
    amountVnd: p.amountVnd,
    orderId: p.orderId,
    expiresAt: p.order.expiresAt,
  });
});