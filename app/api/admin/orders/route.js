import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { expireStaleOrders } from '@/lib/orders';

const schema = z.object({
  status: z.enum(['PENDING', 'AWAITING_CONFIRM', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED']).optional(),
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

export const GET = handle(async (request) => {
  await requireAdmin(request);
  await expireStaleOrders();
  const p = schema.parse(Object.fromEntries(request.nextUrl.searchParams));

  // Tìm theo mã đơn (nếu gõ số) hoặc email người mua
  const search = p.q
    ? {
        OR: [
          ...(/^\d+$/.test(p.q) ? [{ id: Number(p.q) }] : []),
          { user: { email: { contains: p.q, mode: 'insensitive' } } },
        ],
      }
    : {};
  const where = { ...(p.status && { status: p.status }), ...search };

  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        user: { select: { email: true, name: true } },
        items: { select: { id: true, title: true, platform: true, quantity: true } },
        payment: { select: { method: true, status: true } },
      },
    }),
  ]);

  return ok({ items, total, page: p.page, totalPages: Math.ceil(total / p.limit) });
});