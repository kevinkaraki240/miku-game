import { handle, ok } from '@/lib/http';
import { getGenres } from '@/lib/games';

export const GET = handle(async () => ok(await getGenres()));