import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body, HttpError } from '@/lib/http';
import { hashPassword, signToken, withCookie } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(50),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100),
});

export const POST = handle(async (request) => {
  const data = await body(request, schema);
  const email = data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'Email đã được sử dụng');

  const user = await prisma.user.create({
    data: { email, name: data.name, passwordHash: await hashPassword(data.password) },
    select: { id: true, email: true, name: true, role: true },
  });
  const token = await signToken(user);
  return withCookie(ok({ user, token }, 201), token);
});