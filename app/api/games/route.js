import { handle, ok } from '@/lib/http';
import { searchGames } from '@/lib/games';

export const GET = handle(async (request) =>
  ok(await searchGames(Object.fromEntries(request.nextUrl.searchParams)))
);