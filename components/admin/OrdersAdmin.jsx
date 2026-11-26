'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatVnd } from '@/lib/format';

const STATUS = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-500/20 text-amber-300' },
  AWAITING_CONFIRM: { label: 'Chờ duyệt', cls: 'bg-amber-500/20 text-amber-300' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-miku/20 text-miku' },
  FAILED: { label: 'Thất bại', cls: 'bg-pink/20 text-pink' },
  EXPIRED: { label: 'Hết hạn', cls: 'bg-panel text-muted' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-indigo-500/20 text-indigo-300' },
};

const FILTERS = [{ value: '', label: 'Tất cả' }, ...Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label }))];

const fmtTime = (d) =>
  new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function OrdersAdmin() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ page: String(page) });
    if (status) sp.set('status', status);
    if (query) sp.set('q', query);
    const res = await fetch(`/api/admin/orders?${sp}`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setError(d.error ?? 'Không tải được đơn hàng');
    setError('');
    setData(d);
  }, [status, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function refund(order) {
    if (!window.confirm(`Hoàn ${formatVnd(order.totalVnd)} vào ví cho ${order.user.email} và thu hồi key của đơn #${order.id}?`)) return;
    setBusyId(order.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? 'Hoàn tiền thất bại');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  // Duyệt hoặc từ chối đơn chuyển khoản
  async function review(order, action) {
    const text =
      action === 'approve'
        ? `Xác nhận đã nhận ${formatVnd(order.totalVnd)} từ ${order.user.email}? Key sẽ được giao cho khách.`
        : `Từ chối đơn #${order.id}? Key sẽ được trả về kho.`;
    if (!window.confirm(text)) return;
    setBusyId(order.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/${action}`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? 'Thao tác thất bại');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                status === f.value ? 'border-miku bg-miku text-bg' : 'border-line text-muted hover:border-miku hover:text-miku'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }}
          className="ml-auto flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mã đơn hoặc email..."
            className="w-56 rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-miku"
          />
          <button className="rounded-xl border border-miku px-4 text-sm font-bold text-miku hover:bg-miku/10">Tìm</button>
        </form>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-pink/40 bg-pink/10 px-3 py-2 text-sm font-medium text-pink">{error}</p>}

      {!data ? (
        <div className="mt-4 h-64 animate-pulse rounded-2xl border border-line bg-panel/60" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">Không có đơn hàng phù hợp.</td></tr>
                )}
                {data.items.map((o) => {
                  const st = STATUS[o.status] ?? STATUS.EXPIRED;
                  return (
                    <tr key={o.id} className="border-t border-line align-top">
                      <td className="px-4 py-3">
                        <b>#{o.id}</b>
                        <div className="text-xs text-muted">{fmtTime(o.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.user.name}</div>
                        <div className="text-xs text-muted">{o.user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {o.items.map((i) => (
                          <div key={i.id}>{i.title} [{i.platform}] × {i.quantity}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-miku">{formatVnd(o.totalVnd)}</div>
                        {o.payment && <div className="text-xs text-muted">{o.payment.method}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {o.status === 'AWAITING_CONFIRM' && (
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={busyId === o.id}
                              onClick={() => review(o, 'approve')}
                              className="rounded-full bg-miku px-3 py-1 text-xs font-bold text-bg hover:brightness-110 disabled:opacity-40"
                            >
                              Duyệt
                            </button>
                            <button
                              disabled={busyId === o.id}
                              onClick={() => review(o, 'reject')}
                              className="rounded-full border border-pink/60 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/10 disabled:opacity-40"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                        {o.status === 'PAID' && (
                          <button
                            disabled={busyId === o.id}
                            onClick={() => refund(o)}
                            className="rounded-full border border-pink/60 px-3 py-1 text-xs font-bold text-pink transition hover:bg-pink/10 disabled:opacity-40"
                          >
                            {busyId === o.id ? 'Đang hoàn...' : 'Hoàn tiền'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>{data.total} đơn</span>
            {data.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-line px-3 py-1.5 hover:border-miku hover:text-miku disabled:opacity-30">← Trước</button>
                <span>Trang {data.page}/{data.totalPages}</span>
                <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-line px-3 py-1.5 hover:border-miku hover:text-miku disabled:opacity-30">Sau →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}