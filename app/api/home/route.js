import { handle, ok } from '@/lib/http';
import { getHomeData } from '@/lib/home';

export const GET = handle(async () => ok(await getHomeData()));