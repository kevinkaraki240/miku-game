import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { cartSummary } from '@/lib/cart';

export const DELETE = handle(async (request, { params }) => {
  const user = await requireUser(request);
  const editionId = Number((await params).editionId);
  await prisma.cartItem.deleteMany({ where: { userId: user.id, editionId } });
  return ok(await cartSummary(user.id));
});