import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  priceVnd: z.number().int().min(1000).optional(),
  discountPercent: z.number().int().min(0).max(90).optional(),
  saleEndsAt: z.string().datetime().nullable().optional(),
});

export const PATCH = handle(async (request, { params }) => {
  await requireAdmin(request);
  const id = Number((await params).id);
  const d = await body(request, schema);
  const edition = await prisma.edition.update({
    where: { id },
    data: {
      ...(d.priceVnd !== undefined && { priceVnd: d.priceVnd }),
      ...(d.discountPercent !== undefined && { discountPercent: d.discountPercent }),
      ...(d.saleEndsAt !== undefined && { saleEndsAt: d.saleEndsAt ? new Date(d.saleEndsAt) : null }),
    },
  });
  return ok(edition);
});