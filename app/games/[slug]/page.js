import { notFound } from 'next/navigation';
import BuyPanel from '@/components/BuyPanel';
import Gallery from '@/components/Gallery';
import GameCard from '@/components/GameCard';
import { getGameDetail } from '@/lib/gameDetail';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = await getGameDetail(slug);
  return { title: game?.title ?? 'Không tìm thấy game' };
}

export default async function GameDetailPage({ params }) {
  const { slug } = await params;
  const found = await getGameDetail(slug);
  if (!found) notFound();
  const game = JSON.parse(JSON.stringify(found));

  const bg = game.backgroundUrl || game.coverUrl;
  const upcoming = !!game.releaseDate && new Date(game.releaseDate) > new Date();

  return (
    <div>
      {/* Ảnh nền lớn */}
      <div className="relative h-[320px] overflow-hidden sm:h-[420px]">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent" />
      </div>

      <div className="relative mx-auto -mt-44 grid max-w-7xl gap-8 px-4 sm:-mt-56 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink">
            {game.genres.map((g) => (
              <span key={g} className="rounded-full border border-pink/40 px-2.5 py-1">{g}</span>
            ))}
          </div>

          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-glow sm:text-6xl">{game.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="rounded-md bg-panel px-2 py-1 font-bold text-ink">★ {game.rating.toFixed(1)} / 5</span>
            {game.developer && <span>Nhà phát triển: <b className="text-ink">{game.developer}</b></span>}
            {game.releaseDate && (
              <span>
                {upcoming ? 'Ra mắt' : 'Phát hành'}: <b className="text-ink">{formatDate(game.releaseDate)}</b>
              </span>
            )}
          </div>

          {/* Khối mua hàng: trên điện thoại nằm ngay dưới tiêu đề */}
          <div className="mt-6 lg:hidden">
            <BuyPanel gameId={game.id} slug={game.slug} editions={game.editions} upcoming={upcoming} />
          </div>

          {game.description && (
            <section className="mt-10">
              <h2 className="mb-3 text-xl font-extrabold">Giới thiệu</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{game.description}</p>
            </section>
          )}

          {game.screenshots.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-xl font-extrabold">Hình ảnh</h2>
              <Gallery images={game.screenshots} title={game.title} />
            </section>
          )}
        </div>

        {/* Khối mua hàng trên máy tính: dính theo khi cuộn */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <BuyPanel gameId={game.id} slug={game.slug} editions={game.editions} upcoming={upcoming} />
          </div>
        </div>
      </div>

      {game.related.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight">
            <span className="mr-2 inline-block h-5 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
            Game tương tự
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {game.related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}