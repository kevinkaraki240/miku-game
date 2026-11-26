import { z } from 'zod';
import { handle, ok, body } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { claimTransfer } from '@/lib/payments';

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { orderId } = await body(request, z.object({ orderId: z.number().int().positive() }));
  return ok(await claimTransfer(user, orderId));
});