import { z } from 'zod';
import { handle, ok, body, HttpError } from '@/lib/http';
import { settlePayment } from '@/lib/payments';

const schema = z.object({ providerRef: z.string(), result: z.enum(['SUCCESS', 'FAILED']) });

export const POST = handle(async (request) => {
  if (request.headers.get('x-webhook-secret') !== process.env.WEBHOOK_SECRET) {
    throw new HttpError(401, 'Sai chữ ký webhook');
  }
  const { providerRef, result } = await body(request, schema);
  return ok(await settlePayment(providerRef, result));
});