import { HttpError } from './http';

const hits = new Map();

export function rateLimit(key, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new HttpError(429, 'Thử quá nhiều lần, vui lòng đợi một phút');
  recent.push(now);
  hits.set(key, recent);
}