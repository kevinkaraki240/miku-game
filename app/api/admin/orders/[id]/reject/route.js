import { handle, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { rejectTransfer } from '@/lib/payments';

export const POST = handle(async (request, { params }) => {
  await requireAdmin(request);
  return ok(await rejectTransfer(Number((await params).id)));
});