import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

export const GET = handle(async (request) => {
  await requireAdmin(request);
  const p = schema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const where = p.q ? { game: { title: { contains: p.q, mode: 'insensitive' } } } : {};
  const [total, rows] = await Promise.all([
    prisma.edition.count({ where }),
    prisma.edition.findMany({
      where,
      orderBy: [{ game: { title: 'asc' } }, { platform: 'asc' }],
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        game: { select: { title: true, slug: true } },
        _count: { select: { keys: { where: { status: 'AVAILABLE' } } } },
      },
    }),
  ]);

  return ok({
    items: rows.map((e) => ({
      id: e.id,
      title: e.game.title,
      slug: e.game.slug,
      platform: e.platform,
      priceVnd: e.priceVnd,
      discountPercent: e.discountPercent,
      saleEndsAt: e.saleEndsAt,
      keysLeft: e._count.keys,
    })),
    total,
    page: p.page,
    totalPages: Math.ceil(total / p.limit),
  });
});