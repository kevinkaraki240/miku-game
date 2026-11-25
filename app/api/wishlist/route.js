import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { editionsInclude, serializeGame } from '@/lib/serialize';

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    include: { game: { include: editionsInclude } },
  });
  return ok(rows.map((r) => serializeGame(r.game)));
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { gameId } = await body(request, z.object({ gameId: z.number().int().positive() }));
  if (!(await prisma.game.findUnique({ where: { id: gameId } }))) throw new HttpError(404, 'Không tìm thấy game');
  await prisma.wishlistItem.upsert({
    where: { userId_gameId: { userId: user.id, gameId } },
    create: { userId: user.id, gameId },
    update: {},
  });
  return ok({ ok: true }, 201);
});

// DELETE /api/wishlist?gameId=5
export const DELETE = handle(async (request) => {
  const user = await requireUser(request);
  const gameId = Number(request.nextUrl.searchParams.get('gameId'));
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, gameId } });
  return ok({ ok: true });
});