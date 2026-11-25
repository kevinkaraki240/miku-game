import { prisma } from './db';
import { applyCoupon, effectivePrice } from './pricing';

export async function cartSummary(userId, couponCode) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { id: 'asc' },
    include: {
      edition: {
        include: { game: true, _count: { select: { keys: { where: { status: 'AVAILABLE' } } } } },
      },
    },
  });

  const now = new Date();
  const items = rows.map((r) => {
    const unit = effectivePrice(r.edition, now);
    return {
      editionId: r.editionId,
      quantity: r.quantity,
      gameSlug: r.edition.game.slug,
      title: r.edition.game.title,
      coverUrl: r.edition.game.coverUrl,
      platform: r.edition.platform,
      unitPriceVnd: unit,
      lineTotalVnd: unit * r.quantity,
      inStock: r.edition._count.keys >= r.quantity,
    };
  });

  const subtotalVnd = items.reduce((s, i) => s + i.lineTotalVnd, 0);
  let discountVnd = 0;
  let appliedCode = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    discountVnd = applyCoupon(coupon, subtotalVnd); // ném lỗi nếu mã sai
    appliedCode = coupon.code;
  }
  return { items, subtotalVnd, discountVnd, totalVnd: subtotalVnd - discountVnd, couponCode: appliedCode };
}