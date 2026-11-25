import Link from 'next/link';
import GameCard from './GameCard';

export default function GameSection({ title, subtitle, href, games, upcoming = false, extra }) {
  if (!games?.length) return null;
  return (
    <section className="mx-auto mt-14 max-w-7xl px-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            <span className="mr-2 inline-block h-5 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {extra}
          {href && (
            <Link href={href} className="text-sm font-bold text-miku hover:underline">
              Xem tất cả →
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {games.map((g) => (
          <GameCard key={g.id} game={g} upcoming={upcoming} />
        ))}
      </div>
    </section>
  );
}