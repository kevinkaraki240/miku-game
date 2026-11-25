import { z } from 'zod';
import { handle, ok, body } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { settlePayment } from '@/lib/payments';

const schema = z.object({ providerRef: z.string(), result: z.enum(['SUCCESS', 'FAILED']) });

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { providerRef, result } = await body(request, schema);
  return ok(await settlePayment(providerRef, result, user.id));
});