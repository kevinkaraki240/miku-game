'use client';

import { useEffect, useRef, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

export default function OrderTimer({ expiresAt, onExpire }) {
  const [left, setLeft] = useState(null);
  const cb = useRef(onExpire);
  cb.current = onExpire;

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    let fired = false;
    const tick = () => {
      const l = Math.max(0, end - Date.now());
      setLeft(l);
      if (l === 0 && !fired) {
        fired = true;
        cb.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const urgent = s < 120;

  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${urgent ? 'border-pink bg-pink/10' : 'border-miku/40 bg-miku/10'}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted">Key được giữ trong</p>
      <p className={`text-2xl font-extrabold tabular-nums ${urgent ? 'text-pink' : 'text-miku'}`}>
        {pad(Math.floor(s / 60))}:{pad(s % 60)}
      </p>
    </div>
  );
}