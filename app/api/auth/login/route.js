import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handle, ok, body, HttpError } from '@/lib/http';
import { checkPassword, signToken, withCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = handle(async (request) => {
  rateLimit(`login:${request.headers.get('x-forwarded-for') ?? 'local'}`, 5, 60_000);
  const { email, password } = await body(request, schema);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Cùng một thông báo cho cả "sai email" và "sai mật khẩu" để không lộ email nào đã đăng ký
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Sai email hoặc mật khẩu');
  }

  const safe = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = await signToken(safe);
  return withCookie(ok({ user: safe, token }), token);
});