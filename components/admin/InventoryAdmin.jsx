'use client';

import { useCallback, useEffect, useState } from 'react';
import PlatformBadge from '@/components/PlatformBadge';
import { formatVnd } from '@/lib/format';

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Key GIẢ dạng XXXXX-XXXXX-XXXXX
function fakeKey() {
  const buf = new Uint32Array(15);
  crypto.getRandomValues(buf);
  const chars = Array.from(buf, (n) => ALPHA[n % ALPHA.length]);
  return [0, 5, 10].map((i) => chars.slice(i, i + 5).join('')).join('-');
}

const inputCls = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-miku';

function EditionRow({ e, onChanged }) {
  const [mode, setMode] = useState(null); // null | 'price' | 'keys'
  const [price, setPrice] = useState(e.priceVnd);
  const [discount, setDiscount] = useState(e.discountPercent);
  const [days, setDays] = useState('');
  const [codes, setCodes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const onSale = e.discountPercent > 0 && (!e.saleEndsAt || new Date(e.saleEndsAt) > new Date());

  async function call(url, method, body) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.details?.[0]?.message ?? d.error ?? 'Có lỗi xảy ra');
    return d;
  }

  async function savePrice() {
    setBusy(true);
    setMsg(null);
    try {
      const body = { priceVnd: Number(price), discountPercent: Number(discount) };
      if (Number(discount) === 0) body.saleEndsAt = null;
      else if (days) body.saleEndsAt = new Date(Date.now() + Number(days) * 86400000).toISOString();
      await call(`/api/admin/editions/${e.id}`, 'PATCH', body);
      setMode(null);
      onChanged();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function addKeys() {
    const list = codes.split('\n').map((c) => c.trim()).filter(Boolean);
    if (!list.length) return setMsg({ type: 'err', text: 'Hãy nhập ít nhất một key (mỗi dòng một key).' });
    setBusy(true);
    setMsg(null);
    try {
      const d = await call('/api/admin/keys', 'POST', { editionId: e.id, codes: list });
      setCodes('');
      setMsg({ type: 'ok', text: `Đã thêm ${d.added} key${d.duplicates ? `, bỏ qua ${d.duplicates} key trùng` : ''}.` });
      onChanged();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const toggle = (m) => { setMode((cur) => (cur === m ? null : m)); setMsg(null); };

  return (
    <>
      <tr className="border-t border-line">
        <td className="px-4 py-3 font-medium">{e.title}</td>
        <td className="px-4 py-3"><PlatformBadge platform={e.platform} /></td>
        <td className="px-4 py-3">
          {formatVnd(e.priceVnd)}
          {onSale && <span className="ml-2 rounded bg-pink px-1.5 py-0.5 text-xs font-extrabold text-white">-{e.discountPercent}%</span>}
        </td>
        <td className={`px-4 py-3 font-bold ${e.keysLeft < 5 ? 'text-pink' : 'text-miku'}`}>{e.keysLeft}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <button onClick={() => toggle('price')} className="rounded-full border border-miku px-3 py-1 text-xs font-bold text-miku hover:bg-miku/10">Sửa giá</button>
            <button onClick={() => toggle('keys')} className="rounded-full border border-pink/60 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/10">Nhập key</button>
          </div>
        </td>
      </tr>

      {mode && (
        <tr className="bg-panel/60">
          <td colSpan={5} className="px-4 py-4">
            {mode === 'price' ? (
              <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted">Giá gốc (đ)</label>
                  <input type="number" min={1000} step={1000} value={price} onChange={(ev) => setPrice(ev.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted">Giảm giá (%)</label>
                  <input type="number" min={0} max={90} value={discount} onChange={(ev) => setDiscount(ev.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted">Kết thúc sau (ngày)</label>
                  <input type="number" min={1} max={60} value={days} onChange={(ev) => setDays(ev.target.value)} placeholder="giữ nguyên" className={inputCls} />
                </div>
                <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
                  <button disabled={busy} onClick={savePrice} className="rounded-full bg-miku px-5 py-2 text-sm font-bold text-bg hover:brightness-110 disabled:opacity-50">
                    {busy ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <p className="text-xs text-muted">Giảm giá có hạn sẽ tự xuất hiện ở mục Flash Sale trên trang chủ. Đặt giảm 0% để tắt.</p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl space-y-3">
                <textarea
                  value={codes}
                  onChange={(ev) => setCodes(ev.target.value)}
                  rows={5}
                  placeholder={'Mỗi dòng một key, ví dụ:\nABCDE-FGHJK-LMNPQ'}
                  className={`${inputCls} font-mono`}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button disabled={busy} onClick={addKeys} className="rounded-full bg-miku px-5 py-2 text-sm font-bold text-bg hover:brightness-110 disabled:opacity-50">
                    {busy ? 'Đang thêm...' : 'Thêm key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodes((c) => (c ? c + '\n' : '') + Array.from({ length: 10 }, fakeKey).join('\n'))}
                    className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:border-miku hover:text-miku"
                  >
                    Tạo nhanh 10 key giả
                  </button>
                </div>
              </div>
            )}
            {msg && <p role="status" className={`mt-3 text-sm font-medium ${msg.type === 'ok' ? 'text-miku' : 'text-pink'}`}>{msg.text}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

export default function InventoryAdmin() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ page: String(page) });
    if (query) sp.set('q', query);
    const res = await fetch(`/api/admin/editions?${sp}`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setError(d.error ?? 'Không tải được dữ liệu');
    setError('');
    setData(d);
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên game..."
          className="w-64 rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-miku"
        />
        <button className="rounded-xl border border-miku px-4 text-sm font-bold text-miku hover:bg-miku/10">Tìm</button>
      </form>

      {error && <p role="alert" className="mt-4 text-pink">{error}</p>}

      {!data ? (
        <div className="mt-4 h-64 animate-pulse rounded-2xl border border-line bg-panel/60" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Nền tảng</th>
                  <th className="px-4 py-3">Giá</th>
                  <th className="px-4 py-3">Key còn</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">Không có phiên bản phù hợp.</td></tr>
                )}
                {data.items.map((e) => (
                  <EditionRow key={e.id} e={e} onChanged={load} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>{data.total} phiên bản</span>
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