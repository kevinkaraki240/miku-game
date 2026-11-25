import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { HttpError } from './http';

export const COOKIE = 'miku_token';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const hashPassword = (p) => bcrypt.hash(p, 10);
export const checkPassword = (p, hash) => bcrypt.compare(p, hash);

export const signToken = (user) =>
  new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());

export function withCookie(res, token) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });
  return res;
}

// Đọc token từ header "Authorization: Bearer ..." (tiện cho Postman) hoặc từ cookie (cho trình duyệt)
export async function getUser(request) {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true, role: true, walletBalance: true, points: true },
    });
  } catch {
    return null;
  }
}

export async function requireUser(request) {
  const user = await getUser(request);
  if (!user) throw new HttpError(401, 'Bạn cần đăng nhập');
  return user;
}

export async function requireAdmin(request) {
  const user = await requireUser(request);
  if (user.role !== 'ADMIN') throw new HttpError(403, 'Bạn không có quyền');
  return user;
}