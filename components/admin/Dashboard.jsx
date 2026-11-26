'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatVnd } from '@/lib/format';

const STATUS_LABEL = {
  PENDING: 'Chờ thanh toán',
  AWAITING_CONFIRM: 'Chờ admin duyệt',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
  REFUNDED: 'Đã hoàn tiền',
};

function Stat({ label, value, accent = 'text-miku' }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? 'Không tải được số liệu');
        setS(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-pink">{error}</p>;
  if (!s) return <div className="h-64 animate-pulse rounded-2xl border border-line bg-panel/60" />;

  const count = (st) => s.orders.find((o) => o.status === st)?.count ?? 0;
  const paid = s.orders.find((o) => o.status === 'PAID');
  const awaiting = count('AWAITING_CONFIRM');

  // 14 ngày gần nhất, tính theo giờ UTC để khớp với cách server nhóm doanh thu
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { day, value: s.revenueByDay[day] ?? 0 };
  });
  const max = Math.max(...days.map((d) => d.value), 1);
  const total14 = days.reduce((a, d) => a + d.value, 0);

  return (
    <div className="space-y-6">
      {awaiting > 0 && (
        <Link
          href="/admin/orders"
          className="block rounded-2xl border border-amber-400/50 bg-amber-500/10 px-5 py-3 font-bold text-amber-300 transition hover:bg-amber-500/20"
        >
          Có {awaiting} đơn chuyển khoản đang chờ bạn duyệt →
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Tổng doanh thu" value={formatVnd(paid?.totalVnd ?? 0)} />
        <Stat label="Đơn đã thanh toán" value={count('PAID')} />
        <Stat label="Đơn chờ thanh toán" value={count('PENDING')} accent="text-amber-300" />
        <Stat label="Người dùng" value={s.users} accent="text-pink" />
      </div>

      <section className="rounded-2xl border border-line bg-panel/60 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-extrabold">Doanh thu 14 ngày gần nhất</h2>
          <span className="text-sm text-muted">Tổng: <b className="text-miku">{formatVnd(total14)}</b></span>
        </div>
        <div className="mt-5 flex h-48 items-end gap-1.5 sm:gap-2">
          {days.map((d) => (
            <div key={d.day} className="group flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${formatVnd(d.value)}`}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 1)}%` }}
                transition={{ duration: 0.6 }}
                className={`rounded-t-md ${d.value > 0 ? 'bg-gradient-to-t from-miku to-pink group-hover:glow' : 'bg-line'}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-2">
          {days.map((d) => (
            <span key={d.day} className="flex-1 text-center text-[10px] text-muted">
              {d.day.slice(8)}/{d.day.slice(5, 7)}
            </span>
          ))}
        </div>
        {total14 === 0 && <p className="mt-3 text-center text-xs text-muted">Chưa có đơn nào được thanh toán trong 14 ngày qua.</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-panel/60 p-5">
          <h2 className="font-extrabold">Game bán chạy</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {s.topGames.length === 0 && <li className="text-muted">Chưa có dữ liệu.</li>}
            {s.topGames.map((g, i) => (
              <li key={g.title} className="flex items-center justify-between gap-2">
                <span className="line-clamp-1"><b className="mr-2 text-miku">{i + 1}</b>{g.title}</span>
                <span className="shrink-0 text-muted">{g.sold} key</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-line bg-panel/60 p-5">
          <h2 className="font-extrabold">Đơn theo trạng thái</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {s.orders.length === 0 && <li className="text-muted">Chưa có đơn nào.</li>}
            {s.orders.map((o) => (
              <li key={o.status} className="flex items-center justify-between">
                <span>{STATUS_LABEL[o.status] ?? o.status}</span>
                <span className="text-muted">{o.count} đơn · {formatVnd(o.totalVnd)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-pink/40 bg-pink/5 p-5">
          <h2 className="font-extrabold text-pink">Sắp hết key (dưới 5)</h2>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
            {s.lowStock.length === 0 && <li className="text-muted">Kho đang ổn.</li>}
            {s.lowStock.map((e) => (
              <li key={e.editionId} className="flex items-center justify-between gap-2">
                <span className="line-clamp-1">{e.title} <span className="text-xs text-muted">[{e.platform}]</span></span>
                <span className="shrink-0 font-bold text-pink">còn {e.keysLeft}</span>
              </li>
            ))}
          </ul>
          {s.lowStock.length > 0 && (
            <Link href="/admin/inventory" className="mt-3 inline-block text-sm font-bold text-miku hover:underline">Nhập thêm key →</Link>
          )}
        </section>
      </div>
    </div>
  );
}