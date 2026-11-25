import { handle, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const GET = handle(async (request) => ok(await requireUser(request)));