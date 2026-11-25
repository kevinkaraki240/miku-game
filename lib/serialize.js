import { effectivePrice, isOnSale } from './pricing';

// include dùng chung: lấy phiên bản + số key còn hàng
export const editionsInclude = {
  editions: {
    orderBy: { platform: 'asc' },
    include: { _count: { select: { keys: { where: { status: 'AVAILABLE' } } } } },
  },
};

export function serializeGame(g, { detail = false } = {}) {
  const now = new Date();
  const out = {
    id: g.id,
    slug: g.slug,
    title: g.title,
    coverUrl: g.coverUrl,
    rating: g.rating,
    genres: g.genres ? g.genres.split(',') : [],
    releaseDate: g.releaseDate,
    editions: g.editions.map((e) => ({
      id: e.id,
      platform: e.platform,
      priceVnd: e.priceVnd,
      finalPriceVnd: effectivePrice(e, now),
      discountPercent: isOnSale(e, now) ? e.discountPercent : 0,
      saleEndsAt: isOnSale(e, now) ? e.saleEndsAt : null,
      inStock: (e._count?.keys ?? 0) > 0,
    })),
  };
  if (detail) {
    out.description = g.description;
    out.backgroundUrl = g.backgroundUrl;
    out.trailerUrl = g.trailerUrl;
    out.developer = g.developer;
    out.screenshots = JSON.parse(g.screenshots || '[]');
  }
  return out;
}