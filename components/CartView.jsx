'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PlatformBadge from './PlatformBadge';
import { formatVnd } from '@/lib/format';

export default function CartView() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [code, setCode] = useState('');       // ô đang nhập
  const [applied, setApplied] = useState(''); // mã đã áp dụng thành công
  const [msg, setMsg] = useState(null);       // { type: 'ok' | 'err', text }
  const [busy, setBusy] = useState(false);

  // Tải giỏ (kèm mã giảm giá nếu có). Ném lỗi nếu mã không hợp lệ.
  const load = useCallback(
    async (coupon = '') => {
      const res = await fetch(coupon ? `/api/cart?coupon=${encodeURIComponent(coupon)}` : '/api/cart');
      if (res.status === 401) {
        router.push('/login?next=/cart');
        return null;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra');
      setCart(data);
      return data;
    },
    [router]
  );

  useEffect(() => {
    load().catch((e) => setMsg({ type: 'err', text: e.message }));
  }, [load]);

  // Tải lại sau khi sửa giỏ; nếu mã không còn hợp lệ (ví dụ giỏ dưới mức tối thiểu) thì gỡ mã
  async function refresh() {
    try {
      await load(applied);
    } catch (e) {
      setApplied('');
      setMsg({ type: 'err', text: `${e.message}. Mã đã được gỡ.` });
      await load('').catch(() => {});
    }
    window.dispatchEvent(new Event('cart:changed'));
  }

  async function changeQty(editionId, quantity) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra');
      await refresh();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(editionId) {
    setBusy(true);
    setMsg(null);
    try {
      await fetch(`/api/cart/${editionId}`, { method: 'DELETE' });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    setMsg(null);
    try {
      const data = await load(c);
      if (data) {
        setApplied(data.couponCode);
        setCode('');
        setMsg({ type: 'ok', text: `Đã áp dụng mã ${data.couponCode}` });
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function removeCoupon() {
    setApplied('');
    setMsg(null);
    await load('').catch(() => {});
  }

  async function checkout() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applied ? { couponCode: applied } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Không tạo được đơn hàng');
      window.dispatchEvent(new Event('cart:changed'));
      router.push(`/checkout/${data.id}`);
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
      setBusy(false);
    }
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-panel/60" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-extrabold">Giỏ hàng đang trống</h1>
        <p className="mt-1 text-sm text-muted">Chọn vài tựa game thật hay để bắt đầu nhé.</p>
        <Link href="/games" className="mt-6 inline-block rounded-full bg-miku px-7 py-3 font-bold text-bg hover:brightness-110">
          Đến cửa hàng
        </Link>
      </div>
    );
  }

  const allInStock = cart.items.every((i) => i.inStock);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        Giỏ hàng
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.editionId} className="flex gap-4 rounded-2xl border border-line bg-panel/60 p-3">
              <Link href={`/games/${i.gameSlug}`} className="shrink-0">
                <img src={i.coverUrl} alt="" className="h-24 w-20 rounded-lg object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link href={`/games/${i.gameSlug}`} className="line-clamp-1 font-bold hover:text-miku">
                    {i.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <PlatformBadge platform={i.platform} />
                    {!i.inStock && <span className="text-xs font-bold text-pink">Kho không đủ key</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-full border border-line">
                    <button
                      disabled={busy || i.quantity <= 1}
                      onClick={() => changeQty(i.editionId, i.quantity - 1)}
                      aria-label="Giảm số lượng"
                      className="h-8 w-8 transition hover:bg-miku/10 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">{i.quantity}</span>
                    <button
                      disabled={busy || i.quantity >= 5}
                      onClick={() => changeQty(i.editionId, i.quantity + 1)}
                      aria-label="Tăng số lượng"
                      className="h-8 w-8 transition hover:bg-miku/10 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-extrabold text-miku">{formatVnd(i.lineTotalVnd)}</span>
                </div>
              </div>
              <button
                disabled={busy}
                onClick={() => remove(i.editionId)}
                aria-label="Xóa khỏi giỏ"
                className="self-start px-1 text-xl text-muted transition hover:text-pink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-panel/80 p-5 lg:sticky lg:top-24">
          <form onSubmit={applyCoupon}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Mã giảm giá</label>
            {applied ? (
              <div className="flex items-center justify-between rounded-xl border border-miku bg-miku/10 px-3 py-2 text-sm">
                <b className="text-miku">{applied}</b>
                <button type="button" onClick={removeCoupon} className="text-xs text-muted hover:text-pink">
                  Gỡ
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: MIKU10"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm uppercase outline-none focus:border-miku"
                />
                <button
                  disabled={busy}
                  className="rounded-xl border border-miku px-4 text-sm font-bold text-miku transition hover:bg-miku/10 disabled:opacity-40"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </form>

          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="font-medium">{formatVnd(cart.subtotalVnd)}</dd>
            </div>
            {cart.discountVnd > 0 && (
              <div className="flex justify-between text-pink">
                <dt>Giảm giá</dt>
                <dd className="font-medium">−{formatVnd(cart.discountVnd)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt className="font-bold">Tổng cộng</dt>
              <dd className="font-extrabold text-miku">{formatVnd(cart.totalVnd)}</dd>
            </div>
          </dl>

          {msg && (
            <p role="status" className={`text-sm font-medium ${msg.type === 'ok' ? 'text-miku' : 'text-pink'}`}>
              {msg.text}
            </p>
          )}

          <button
            disabled={busy || !allInStock}
            onClick={checkout}
            className="w-full rounded-full bg-miku py-3 font-bold text-bg transition hover:brightness-110 hover:glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allInStock ? 'Thanh toán' : 'Có game hết key'}
          </button>
          <p className="text-center text-xs text-muted">Key được giữ 15 phút sau khi tạo đơn.</p>
        </aside>
      </div>
    </div>
  );
}