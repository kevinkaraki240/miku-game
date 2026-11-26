import { handle, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { approveTransfer } from '@/lib/payments';

export const POST = handle(async (request, { params }) => {
  await requireAdmin(request);
  return ok(await approveTransfer(Number((await params).id)));
});  