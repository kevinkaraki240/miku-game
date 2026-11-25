import { prisma } from './db';
import { HttpError } from './http';
import { ORDER_TTL_MINUTES } from './config';
import { applyCoupon, effectivePrice } from './pricing';

// Huỷ đơn (FAILED/EXPIRED) và trả key về kho
export async function failOrder(tx, orderId, status) {
  await tx.gameKey.updateMany({
    where: { orderItem: { orderId }, status: 'RESERVED' },
    data: { status: 'AVAILABLE', orderItemId: null },
  });
  await tx.order.update({ where: { id: orderId }, data: { status } });
  await tx.payment.updateMany({
    where: { orderId, status: 'INITIATED' },
    data: { status: status === 'EXPIRED' ? 'EXPIRED' : 'FAILED' },
  });
}

// Quét các đơn quá hạn. Gọi mỗi khi có người tạo đơn / thanh toán / xem đơn.
export async function expireStaleOrders() {
  const stale = await prisma.order.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  for (const { id } of stale) {
    await prisma.$transaction((tx) => failOrder(tx, id, 'EXPIRED'));
  }
}

export async function createOrderFromCart(user, couponCode) {
  await expireStaleOrders();

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cartItem.findMany({
      where: { userId: user.id },
      include: { edition: { include: { game: true } } },
    });
    if (!cart.length) throw new HttpError(400, 'Giỏ hàng trống');

    // Chặn mua game chưa phát hành
    const now = new Date();
    const unreleased = cart.find((c) => c.edition.game.releaseDate && c.edition.game.releaseDate > now);
    if (unreleased) {
      throw new HttpError(400, `${unreleased.edition.game.title} chưa phát hành, hãy bỏ khỏi giỏ để tiếp tục`);
    }

    const lines = cart.map((c) => ({ c, unit: effectivePrice(c.edition, now) }));
    const subtotal = lines.reduce((s, l) => s + l.unit * l.c.quantity, 0);

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
      discount = applyCoupon(coupon, subtotal);
    }

    const order = await tx.order.create({
      data: {
        userId: user.id,
        subtotalVnd: subtotal,
        discountVnd: discount,
        totalVnd: subtotal - discount,
        couponCode: coupon?.code ?? null,
        expiresAt: new Date(Date.now() + ORDER_TTL_MINUTES * 60_000),
      },
    });

    for (const { c, unit } of lines) {
      const item = await tx.orderItem.create({
        data: {
          orderId: order.id,
          editionId: c.editionId,
          title: c.edition.game.title,
          platform: c.edition.platform,
          unitPriceVnd: unit,
          quantity: c.quantity,
        },
      });

      const keys = await tx.gameKey.findMany({
        where: { editionId: c.editionId, status: 'AVAILABLE' },
        take: c.quantity,
        select: { id: true },
      });
      if (keys.length < c.quantity) {
        throw new HttpError(409, `${c.edition.game.title} (${c.edition.platform}) không đủ key trong kho`);
      }
      // Điều kiện status: 'AVAILABLE' đảm bảo không ai khác vừa lấy mất key
      const res = await tx.gameKey.updateMany({
        where: { id: { in: keys.map((k) => k.id) }, status: 'AVAILABLE' },
        data: { status: 'RESERVED', orderItemId: item.id },
      });
      if (res.count !== keys.length) throw new HttpError(409, 'Key vừa được người khác mua, vui lòng thử lại');
    }

    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return order;
  });
}