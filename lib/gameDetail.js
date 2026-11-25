import { prisma } from './db';
import { editionsInclude, serializeGame } from './serialize';

export async function getGameDetail(slug) {
  const game = await prisma.game.findUnique({ where: { slug }, include: editionsInclude });
  if (!game) return null;

  const firstGenre = game.genres.split(',')[0];
  const related = firstGenre
    ? await prisma.game.findMany({
        where: { genres: { contains: firstGenre }, NOT: { id: game.id } },
        orderBy: { rating: 'desc' },
        take: 4,
        include: editionsInclude,
      })
    : [];

  return { ...serializeGame(game, { detail: true }), related: related.map((g) => serializeGame(g)) };
}