'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatVnd, formatDate } from '@/lib/format';

const STATUS = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-500/20 text-amber-300' },
  AWAITING_CONFIRM: { label: 'Chờ admin duyệt', cls: 'bg-amber-500/20 text-amber-300' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-miku/20 text-miku' },
  FAILED: { label: 'Thất bại', cls: 'bg-pink/20 text-pink' },
  EXPIRED: { label: 'Hết hạn', cls: 'bg-panel text-muted' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-indigo-500/20 text-indigo-300' },
};

const TOPUPS = [100_000, 500_000, 1_000_000];

export default function AccountView() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [keys, setKeys] = useState([]);
  const [tab, setTab] = useState('orders');
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/auth/me');
      if (meRes.status === 401) return router.push('/login?next=/account');
      setMe(await meRes.json());
      const [o, k] = await Promise.all([fetch('/api/orders'), fetch('/api/library')]);
      if (o.ok) setOrders(await o.json());
      if (k.ok) setKeys(await k.json());
    })();
  }, [router]);

  async function topup(amountVnd) {
    setBusy(true);
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd }),
      });
      if (res.ok) {
        const data = await res.json();
        setMe((m) => ({ ...m, walletBalance: data.walletBalance }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  }

  if (!me) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-64 animate-pulse rounded-2xl border border-line bg-panel/60" /></div>;
  }

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
        tab === id ? 'border-miku bg-miku text-bg' : 'border-line text-muted hover:border-miku hover:text-miku'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        Tài khoản
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel/60 p-5 md:col-span-1">
          <p className="text-lg font-extrabold">{me.name}</p>
          <p className="text-sm text-muted">{me.email}</p>
          {me.role === 'ADMIN' && <span className="mt-2 inline-block rounded bg-pink px-2 py-0.5 text-xs font-bold text-white">Quản trị viên</span>}
        </div>

        <div className="rounded-2xl border border-line bg-panel/60 p-5 md:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-miku">Ví Miku</p>
              <p className="text-3xl font-extrabold text-glow">{formatVnd(me.walletBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-pink">Điểm thưởng</p>
              <p className="text-2xl font-extrabold">{me.points}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Nạp giả lập:</span>
            {TOPUPS.map((a) => (
              <button
                key={a}
                disabled={busy}
                onClick={() => topup(a)}
                className="rounded-full border border-miku px-3 py-1 text-sm font-bold text-miku transition hover:bg-miku/10 disabled:opacity-40"
              >
                +{formatVnd(a)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        {tabBtn('orders', `Đơn hàng (${orders.length})`)}
        {tabBtn('library', `Thư viện key (${keys.length})`)}
      </div>

      {tab === 'orders' && (
        <ul className="mt-4 space-y-3">
          {orders.length === 0 && <li className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">Bạn chưa có đơn hàng nào.</li>}
          {orders.map((o) => {
            const st = STATUS[o.status] ?? STATUS.EXPIRED;
            return (
              <li key={o.id} className="rounded-2xl border border-line bg-panel/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <b>Đơn #{o.id}</b>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-sm text-muted">
                  {o.items.map((i) => (
                    <li key={i.id}>{i.title} [{i.platform}] × {i.quantity}</li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-extrabold text-miku">{formatVnd(o.totalVnd)}</span>
                  {(o.status === 'PENDING' || o.status === 'AWAITING_CONFIRM') && (
                    <Link href={`/checkout/${o.id}`} className="rounded-full bg-miku px-4 py-1.5 text-sm font-bold text-bg hover:brightness-110">
                      {o.status === 'PENDING' ? 'Thanh toán' : 'Xem trạng thái'}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'library' && (
        <ul className="mt-4 space-y-3">
          {keys.length === 0 && <li className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">Chưa có key nào. Key xuất hiện ở đây sau khi đơn được thanh toán.</li>}
          {keys.map((k) => (
            <li key={k.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/60 p-4">
              <div>
                <p className="font-bold">{k.title} <span className="text-xs text-muted">[{k.platform}]</span></p>
                <p className="text-xs text-muted">Đơn #{k.orderId} · {formatDate(k.purchasedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm tracking-wider">{k.code}</code>
                <button onClick={() => copy(k.code)} className="rounded-full border border-miku px-3 py-1.5 text-xs font-bold text-miku hover:bg-miku/10">
                  {copied === k.code ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}