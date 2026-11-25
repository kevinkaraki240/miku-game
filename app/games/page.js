import { Suspense } from 'react';
import Filters from '@/components/Filters';
import GameCard from '@/components/GameCard';
import Pagination from '@/components/Pagination';
import { getGenres, querySchema, searchGames } from '@/lib/games';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cửa hàng game' };

const PLATFORM_TITLE = { STEAM: 'Game Steam (PC)', PS5: 'Game PS5', PS4: 'Game PS4' };

export default async function GamesPage({ searchParams }) {
  const sp = await searchParams;

  // searchParams có thể là mảng (?a=1&a=2), lấy giá trị đầu; tham số sai thì dùng mặc định
  const raw = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = querySchema.safeParse(raw);
  const params = parsed.success ? parsed.data : querySchema.parse({});

  const [result, genres] = await Promise.all([searchGames(params), getGenres()]);
  const data = JSON.parse(JSON.stringify(result));

  // Tạo link phân trang, giữ nguyên các bộ lọc đang chọn
  function hrefFor(page) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (k !== 'page' && v) next.set(k, v);
    if (page > 1) next.set('page', String(page));
    const qs = next.toString();
    return qs ? `/games?${qs}` : '/games';
  }

  const title = params.q
    ? `Kết quả cho "${params.q}"`
    : PLATFORM_TITLE[params.platform] ?? 'Tất cả game';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted">{data.total} game</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-96 rounded-2xl border border-line bg-panel/60" />}>
            <Filters genres={genres} />
          </Suspense>
        </div>

        <div>
          {data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {data.items.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-line py-20 text-center">
              <p className="text-lg font-bold">Không tìm thấy game phù hợp</p>
              <p className="mt-1 text-sm text-muted">Thử bỏ bớt bộ lọc hoặc đổi từ khóa nhé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}