import { handle, ok, HttpError } from '@/lib/http';
import { getGameDetail } from '@/lib/gameDetail';

export const GET = handle(async (request, { params }) => {
  const { slug } = await params;
  const game = await getGameDetail(slug);
  if (!game) throw new HttpError(404, 'Không tìm thấy game');
  return ok(game);
});