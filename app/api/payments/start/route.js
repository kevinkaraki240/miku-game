import { z } from 'zod';
import { handle, ok, body } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { startPayment } from '@/lib/payments';

const schema = z.object({
  orderId: z.number().int().positive(),
  method: z.string(),
  cardNumber: z.string().optional(),
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  return ok(await startPayment(user, await body(request, schema)));
});