import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { cartSummary } from '@/lib/cart';

// GET /api/cart?coupon=MIKU10  -> xem giỏ, nếu có coupon thì kiểm tra luôn mã
export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const coupon = request.nextUrl.searchParams.get('coupon');
  return ok(await cartSummary(user.id, coupon));
});

const schema = z.object({
  editionId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(5).default(1),
});

// POST /api/cart -> đặt số lượng cho một phiên bản (thêm mới hoặc cập nhật)
export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { editionId, quantity } = await body(request, schema);

  const edition = await prisma.edition.findUnique({
    where: { id: editionId },
    include: { _count: { select: { keys: { where: { status: 'AVAILABLE' } } } } },
  });
  if (!edition) throw new HttpError(404, 'Không tìm thấy phiên bản game');
  if (edition._count.keys < quantity) throw new HttpError(409, 'Kho không đủ key');

  await prisma.cartItem.upsert({
    where: { userId_editionId: { userId: user.id, editionId } },
    create: { userId: user.id, editionId, quantity },
    update: { quantity },
  });
  return ok(await cartSummary(user.id));
});