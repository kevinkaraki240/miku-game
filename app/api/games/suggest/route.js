import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';

export const GET = handle(async (request) => {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return ok([]);
  const items = await prisma.game.findMany({
    where: { title: { contains: q } },
    take: 6,
    select: { slug: true, title: true, coverUrl: true },
  });
  return ok(items);
});