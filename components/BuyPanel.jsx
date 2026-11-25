'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PlatformBadge from './PlatformBadge';
import Countdown from './Countdown';
import { formatVnd } from '@/lib/format';

export default function BuyPanel({ gameId, slug, editions, upcoming = false }) {
  const router = useRouter();
  const firstInStock = editions.find((e) => e.inStock) ?? editions[0];
  const [selectedId, setSelectedId] = useState(firstInStock?.id);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }

  const edition = editions.find((e) => e.id === selectedId);

  async function call(url, options) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      router.push(`/login?next=/games/${slug}`);
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra');
    return data;
  }

  async function addToCart(goCheckout = false) {
    setBusy(true);
    setMsg(null);
    try {
      const data = await call('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId: edition.id, quantity: 1 }),
      });
      if (!data) return;
      window.dispatchEvent(new Event('cart:changed'));
      if (goCheckout) return router.push('/cart');
      setMsg({ type: 'ok', text: 'Đã thêm vào giỏ hàng' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function addToWishlist() {
    setBusy(true);
    setMsg(null);
    try {
      const data = await call('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      if (data) setMsg({ type: 'ok', text: 'Đã thêm vào danh sách yêu thích' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  if (!edition) return <p className="text-muted">Game chưa có phiên bản để bán.</p>;

  const cannotBuy = busy || !edition.inStock || upcoming;

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-panel/80 p-5 backdrop-blur">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-miku">
          {upcoming ? 'Có trên nền tảng' : 'Chọn nền tảng'}
        </p>
        <div className="grid gap-2">
          {editions.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                e.id === selectedId ? 'border-miku bg-miku/10 glow' : 'border-line hover:border-miku/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <PlatformBadge platform={e.platform} />
                {!upcoming && !e.inStock && <span className="text-xs font-bold text-pink">Hết key</span>}
              </span>
              {upcoming ? (
                <span className="text-sm font-bold text-muted">Chưa có giá</span>
              ) : (
                <span className="flex items-baseline gap-2">
                  {e.discountPercent > 0 && (
                    <>
                      <span className="rounded bg-pink px-1.5 py-0.5 text-xs font-extrabold text-white">
                        -{e.discountPercent}%
                      </span>
                      <span className="text-xs text-muted line-through">{formatVnd(e.priceVnd)}</span>
                    </>
                  )}
                  <span className="font-extrabold text-miku">{formatVnd(e.finalPriceVnd)}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!upcoming && edition.saleEndsAt && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">Ưu đãi kết thúc sau</p>
          <Countdown endsAt={edition.saleEndsAt} />
        </div>
      )}

      <div className="grid gap-2">
        <button
          disabled={cannotBuy}
          onClick={() => addToCart(true)}
          className="rounded-full bg-miku py-3 font-bold text-bg transition hover:brightness-110 hover:glow disabled:cursor-not-allowed disabled:opacity-40"
        >
          {upcoming ? 'Chưa phát hành' : edition.inStock ? 'Mua ngay' : 'Tạm hết key'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={cannotBuy}
            onClick={() => addToCart(false)}
            className="rounded-full border border-miku py-2.5 text-sm font-bold text-miku transition hover:bg-miku/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Thêm vào giỏ
          </button>
          <button
            disabled={busy}
            onClick={addToWishlist}
            className="rounded-full border border-pink/60 py-2.5 text-sm font-bold text-pink transition hover:bg-pink/10 disabled:opacity-40"
          >
            ♥ Yêu thích
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.type === 'ok' ? 'text-miku' : 'text-pink'}`} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}