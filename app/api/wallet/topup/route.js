import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { amountVnd } = await body(request, z.object({ amountVnd: z.number().int().min(10_000).max(5_000_000) }));
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { walletBalance: { increment: amountVnd } },
    select: { walletBalance: true },
  });
  return ok(updated);
});