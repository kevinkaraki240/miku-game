import { z } from 'zod';
import { prisma } from './db';
import { editionsInclude, serializeGame } from './serialize';

export const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  platform: z.enum(['STEAM', 'PS4', 'PS5']).optional(),
  genre: z.string().max(40).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['new', 'rating', 'name']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export async function searchGames(input) {
  const p = querySchema.parse(input);

  const priceFilter =
    p.minPrice !== undefined || p.maxPrice !== undefined
      ? {
          priceVnd: {
            ...(p.minPrice !== undefined && { gte: p.minPrice }),
            ...(p.maxPrice !== undefined && { lte: p.maxPrice }),
          },
        }
      : {};

  const where = {
    ...(p.q && { title: { contains: p.q, mode: 'insensitive' } }),
    ...(p.genre && { genres: { contains: p.genre, mode: 'insensitive' } }),
    editions: { some: { ...(p.platform && { platform: p.platform }), ...priceFilter } },
  };

  const orderBy =
    p.sort === 'rating' ? [{ rating: 'desc' }] :
    p.sort === 'name' ? [{ title: 'asc' }] :
    [{ releaseDate: 'desc' }, { id: 'desc' }];

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: editionsInclude,
    }),
  ]);

  return {
    items: games.map((g) => serializeGame(g)),
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.ceil(total / p.limit),
  };
}

export async function getGenres() {
  const rows = await prisma.game.findMany({ select: { genres: true } });
  const set = new Set(rows.flatMap((r) => r.genres.split(',')).filter(Boolean));
  return [...set].sort();
}