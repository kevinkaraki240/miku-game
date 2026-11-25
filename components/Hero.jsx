'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlatformBadge from './PlatformBadge';
import { formatVnd } from '@/lib/format';

const WAVE = [30, 55, 80, 45, 95, 60, 40, 85, 50, 70, 35, 90, 55, 75, 40, 65, 85, 45, 60, 30];

export default function Hero({ items }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length, i]); // chạy lại khi bấm chấm, để tránh chuyển slide ngay sau khi bấm

  const g = items[i];
  if (!g) return null;
  const best = [...g.editions].sort((a, b) => a.finalPriceVnd - b.finalPriceVnd)[0];

  return (
    <section className="relative mx-auto mt-4 max-w-7xl overflow-hidden rounded-3xl border border-line">
      <div className="relative h-[420px] sm:h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={g.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Ảnh nền phóng to chậm */}
            <motion.img
              src={g.coverUrl}
              alt=""
              initial={{ scale: 1 }}
              animate={{ scale: 1.12 }}
              transition={{ duration: 7, ease: 'linear' }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

            <div className="relative flex h-full max-w-2xl flex-col justify-center gap-4 p-6 sm:p-12">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xs font-bold uppercase tracking-[0.3em] text-pink"
              >
                Nổi bật · {g.genres.slice(0, 2).join(' · ')}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-4xl font-extrabold leading-tight text-glow sm:text-6xl"
              >
                {g.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex gap-1.5">
                  {g.editions.map((e) => (
                    <PlatformBadge key={e.id} platform={e.platform} />
                  ))}
                </div>
                    {g.releaseDate && new Date(g.releaseDate) > new Date() ? (
                  <span className="text-lg font-extrabold text-miku">Sắp ra mắt</span>
                ) : (
                  best && (
                    <span className="text-lg font-extrabold text-miku">
                      Từ {formatVnd(best.finalPriceVnd)}
                    </span>
                  )
                )}
                <span className="rounded-md bg-panel/80 px-2 py-0.5 text-sm font-bold">★ {g.rating.toFixed(1)}</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Link
                  href={`/games/${g.slug}`}
                  className="inline-block rounded-full bg-miku px-7 py-3 font-bold text-bg transition hover:brightness-110 hover:glow"
                >
                  Xem chi tiết
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Sóng âm trang trí */}
        <div className="pointer-events-none absolute bottom-0 right-0 flex h-24 items-end gap-1 px-6 opacity-70">
          {WAVE.map((h, k) => (
            <span
              key={k}
              className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-miku to-pink"
              style={{ height: `${h}%`, animationDelay: `${k * 0.08}s` }}
            />
          ))}
        </div>

        {/* Chấm chuyển slide */}
        <div className="absolute bottom-4 left-6 flex gap-2 sm:left-12">
          {items.map((it, k) => (
            <button
              key={it.slug}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
              className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-miku' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}