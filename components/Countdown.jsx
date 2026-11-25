'use client';

import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

export default function Countdown({ endsAt }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (left === null) return <div className="h-14" />;

  const s = Math.floor(left / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: 'Ngày' },
    { v: Math.floor((s % 86400) / 3600), l: 'Giờ' },
    { v: Math.floor((s % 3600) / 60), l: 'Phút' },
    { v: s % 60, l: 'Giây' },
  ];

  return (
    <div className="flex gap-2">
      {parts.map((p) => (
        <div key={p.l} className="min-w-14 rounded-xl border border-pink/40 bg-pink/10 px-2 py-1.5 text-center">
          <div className="text-xl font-extrabold tabular-nums text-pink">{pad(p.v)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted">{p.l}</div>
        </div>
      ))}
    </div>
  );
}