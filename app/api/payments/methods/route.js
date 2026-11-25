import { ok } from '@/lib/http';
import { METHODS } from '@/lib/payments';

export const GET = () => ok(Object.entries(METHODS).map(([code, label]) => ({ code, label })));