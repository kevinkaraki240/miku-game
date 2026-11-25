import { prisma } from '@/lib/db';
import { handle, ok, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { POINTS_PER_VND } from '@/lib/config';

export const POST = handle(async (request, { params }) => {
  await requireAdmin(request);
  const id = Number((await params).id);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn');
    if (order.status !== 'PAID') throw new HttpError(409, 'Chỉ hoàn tiền được đơn đã thanh toán');

    await tx.order.update({ where: { id }, data: { status: 'REFUNDED' } });
    await tx.gameKey.updateMany({ where: { orderItem: { orderId: id } }, data: { status: 'REVOKED' } });
    await tx.payment.update({ where: { orderId: id }, data: { status: 'REFUNDED' } });

    // Hoàn tiền vào ví, thu hồi điểm đã cộng (không để âm)
    const user = await tx.user.findUnique({ where: { id: order.userId } });
    const pointsBack = Math.min(user.points, Math.floor(order.totalVnd / POINTS_PER_VND));
    await tx.user.update({
      where: { id: order.userId },
      data: { walletBalance: { increment: order.totalVnd }, points: { decrement: pointsBack } },
    });

    // Trả lại lượt dùng mã giảm giá
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });
  return ok({ ok: true });
});