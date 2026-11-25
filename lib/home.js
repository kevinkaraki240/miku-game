import { prisma } from './db';
import { editionsInclude, serializeGame } from './serialize';

export async function getHomeData() {
  const now = new Date();
  const released = { OR: [{ releaseDate: null }, { releaseDate: { lte: now } }] };

  const [flashSale, newest, topRated, upcoming] = await Promise.all([
    // Flash Sale: chỉ game đã phát hành và đang có đợt giảm giá còn hạn
    prisma.game.findMany({
      where: {
        ...released,
        editions: { some: { discountPercent: { gt: 0 }, saleEndsAt: { gt: now } } },
      },
      take: 8,
      include: editionsInclude,
    }),
    // Mới phát hành
    prisma.game.findMany({
      where: { releaseDate: { lte: now } },
      orderBy: { releaseDate: 'desc' },
      take: 8,
      include: editionsInclude,
    }),
    // Đánh giá cao: chỉ game đã phát hành
    prisma.game.findMany({
      where: released,
      orderBy: { rating: 'desc' },
      take: 8,
      include: editionsInclude,
    }),
    // Sắp ra mắt: ngày phát hành ở tương lai
    prisma.game.findMany({
      where: { releaseDate: { gt: now } },
      orderBy: { releaseDate: 'asc' },
      take: 8,
      include: editionsInclude,
    }),
  ]);

  const s = (list) => list.map((g) => serializeGame(g));
  return { flashSale: s(flashSale), newest: s(newest), topRated: s(topRated), upcoming: s(upcoming) };
}