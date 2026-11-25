'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatVnd } from '@/lib/format';

const THEME = {
  MOMO: { name: 'MoMo', color: '#a50064' },
  ZALOPAY: { name: 'ZaloPay', color: '#0068ff' },
  VNPAY: { name: 'VNPay', color: '#005baa' },
  PAYPAL: { name: 'PayPal', color: '#003087' },
};

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500';

export default function MockGateway({ providerRef }) {
  const router = useRouter();
  const [tx, setTx] = useState(null);
  const [field, setField] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payments/ref/${encodeURIComponent(providerRef)}`);
      if (res.status === 401) return router.push(`/login?next=/pay/mock/${providerRef}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? 'Không tìm thấy giao dịch');
      setTx(data);
    })();
  }, [providerRef, router]);

  async function settle(result) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/payments/mock/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerRef, result }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra');
      router.push(`/checkout/${data.orderId}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!tx) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        {error ? <p className="font-bold text-pink">{error}</p> : <div className="h-64 animate-pulse rounded-2xl bg-panel/60" />}
        {error && <Link href="/account" className="mt-4 inline-block font-bold text-miku hover:underline">Về tài khoản →</Link>}
      </div>
    );
  }

  const theme = THEME[tx.method] ?? { name: tx.method, color: '#334155' };
  const isPaypal = tx.method === 'PAYPAL';
  const done = tx.status !== 'INITIATED';

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
        <div className="px-6 py-4 text-xl font-extrabold text-white" style={{ background: theme.color }}>
          {theme.name} <span className="text-sm font-medium opacity-80">· Cổng giả lập</span>
        </div>

        <div className="space-y-4 p-6">
          <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
            Trang mô phỏng của dự án học tập. Không có tiền thật được chuyển và không liên quan đến {theme.name}.
          </p>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Đơn hàng</dt><dd className="font-bold">#{tx.orderId}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Số tiền</dt><dd className="text-lg font-extrabold">{formatVnd(tx.amountVnd)}</dd></div>
          </dl>

          {done ? (
            <div className="text-center">
              <p className="font-bold">Giao dịch này đã được xử lý ({tx.status}).</p>
              <Link href={`/checkout/${tx.orderId}`} className="mt-3 inline-block font-bold underline" style={{ color: theme.color }}>
                Quay lại đơn hàng →
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isPaypal ? 'Email PayPal (nhập gì cũng được)' : 'Mã OTP (nhập gì cũng được)'}
                </label>
                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder={isPaypal ? 'ban@example.com' : '123456'}
                  className={inputCls}
                />
              </div>
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
              <button
                disabled={busy}
                onClick={() => settle('SUCCESS')}
                className="w-full rounded-lg py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                style={{ background: theme.color }}
              >
                {busy ? 'Đang xử lý...' : 'Xác nhận thanh toán (thành công)'}
              </button>
              <button
                disabled={busy}
                onClick={() => settle('FAILED')}
                className="w-full rounded-lg border border-slate-300 py-3 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Giả lập thất bại / hủy giao dịch
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}