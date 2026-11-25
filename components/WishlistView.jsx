'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GameCard from './GameCard';

export default function WishlistView() {
  const router = useRouter();
  const [games, setGames] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/wishlist');
      if (res.status === 401) return router.push('/login?next=/wishlist');
      if (res.ok) setGames(await res.json());
    })();
  }, [router]);

  async function remove(gameId) {
    setGames((list) => list.filter((g) => g.id !== gameId)); // bỏ khỏi màn hình ngay, không đợi server
    await fetch(`/api/wishlist?gameId=${gameId}`, { method: 'DELETE' });
  }

  if (!games) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-64 animate-pulse rounded-2xl border border-line bg-panel/60" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        Danh sách yêu thích
      </h1>

      {games.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line py-20 text-center">
          <p className="text-lg font-bold">Chưa có game nào</p>
          <p className="mt-1 text-sm text-muted">Bấm "♥ Yêu thích" ở trang chi tiết game để lưu lại.</p>
          <Link href="/games" className="mt-5 inline-block font-bold text-miku hover:underline">Đến cửa hàng →</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {games.map((g) => (
            <div key={g.id} className="relative">
              <GameCard game={g} />
              <button
                onClick={() => remove(g.id)}
                aria-label={`Bỏ ${g.title} khỏi yêu thích`}
                className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-pink backdrop-blur transition hover:bg-pink hover:text-white"
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}