'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Gallery({ images, title }) {
  const [open, setOpen] = useState(null); // chỉ số ảnh đang phóng to, hoặc null

  // Phím Esc đóng, mũi tên trái/phải chuyển ảnh
  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            className="group relative aspect-video overflow-hidden rounded-xl border border-line"
            aria-label={`Xem ảnh ${i + 1} của ${title}`}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
          >
            <img
              src={images[open]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setOpen(null)}
              aria-label="Đóng"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-panel text-xl"
            >
              ×
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((i) => (i - 1 + images.length) % images.length);
                  }}
                  aria-label="Ảnh trước"
                  className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-panel text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((i) => (i + 1) % images.length);
                  }}
                  aria-label="Ảnh sau"
                  className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-panel text-xl"
                >
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}