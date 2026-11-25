import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  editionId: z.number().int().positive(),
  codes: z.array(z.string().trim().min(5).max(64)).min(1).max(500),
});

export const POST = handle(async (request) => {
  await requireAdmin(request);
  const { editionId, codes } = await body(request, schema);
  if (!(await prisma.edition.findUnique({ where: { id: editionId } }))) throw new HttpError(404, 'Không tìm thấy phiên bản');

  const unique = [...new Set(codes)];
  const existing = await prisma.gameKey.findMany({ where: { code: { in: unique } }, select: { code: true } });
  const have = new Set(existing.map((k) => k.code));
  const fresh = unique.filter((c) => !have.has(c));

  await prisma.gameKey.createMany({ data: fresh.map((code) => ({ editionId, code })) });
  return ok({ added: fresh.length, duplicates: unique.length - fresh.length }, 201);
});