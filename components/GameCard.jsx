'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import PlatformBadge from './PlatformBadge';
import { formatVnd, formatDate } from '@/lib/format';

export default function GameCard({ game }) {
  // Nghiêng theo vị trí chuột
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 18 });

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  // Tự xác định chưa phát hành theo ngày, không cần truyền prop từ ngoài
  const upcoming = !!game.releaseDate && new Date(game.releaseDate) > new Date();
  const best = [...game.editions].sort((a, b) => a.finalPriceVnd - b.finalPriceVnd)[0];

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ scale: 1.03 }}
      className="group"
    >
      <Link
        href={`/games/${game.slug}`}
        className="block overflow-hidden rounded-2xl border border-line bg-panel transition-shadow duration-300 group-hover:glow"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={game.coverUrl}
            alt={game.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />

          {upcoming ? (
            <span className="absolute left-2 top-2 rounded-lg bg-miku px-2 py-1 text-xs font-extrabold text-bg shadow-lg">
              Sắp ra mắt
            </span>
          ) : (
            best?.discountPercent > 0 && (
              <span className="absolute left-2 top-2 rounded-lg bg-pink px-2 py-1 text-xs font-extrabold text-white shadow-lg">
                -{best.discountPercent}%
              </span>
            )
          )}
          <div className="absolute bottom-2 left-2 flex gap-1">
            {game.editions.map((e) => (
              <PlatformBadge key={e.id} platform={e.platform} />
            ))}
          </div>
        </div>

        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-bold">{game.title}</h3>
          <p className="line-clamp-1 text-xs text-muted">{game.genres.slice(0, 2).join(' · ')}</p>
          {upcoming ? (
            <p className="pt-1 text-sm font-bold text-miku">Ra mắt {formatDate(game.releaseDate)}</p>
          ) : (
            best && (
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-base font-extrabold text-miku">{formatVnd(best.finalPriceVnd)}</span>
                {best.discountPercent > 0 && (
                  <span className="text-xs text-muted line-through">{formatVnd(best.priceVnd)}</span>
                )}
              </div>
            )
          )}
        </div>
      </Link>
    </motion.div>
  );
}