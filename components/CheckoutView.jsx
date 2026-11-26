'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PlatformBadge from './PlatformBadge';
import OrderTimer from './OrderTimer';
import { formatVnd } from '@/lib/format';

const METHOD_UI = {
  QR_BANK: { icon: '🏦', hint: 'Quét mã QR, admin sẽ duyệt sau khi nhận tiền' },
  MOMO: { icon: '💗', hint: 'Chuyển sang trang MoMo giả lập' },
  ZALOPAY: { icon: '🔷', hint: 'Chuyển sang trang ZaloPay giả lập' },
  VNPAY: { icon: '🏧', hint: 'Chuyển sang trang VNPay giả lập' },
  CARD: { icon: '💳', hint: 'Nhập số thẻ test (xem gợi ý bên dưới)' },
  PAYPAL: { icon: '🅿️', hint: 'Chuyển sang trang PayPal giả lập' },
  WALLET: { icon: '👛', hint: 'Trừ trực tiếp vào số dư Ví Miku' },
};

const inputCls = 'w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-miku';

export default function CheckoutView({ orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [methods, setMethods] = useState([]);
  const [me, setMe] = useState(null);
  const [method, setMethod] = useState('QR_BANK');
  const [cardNumber, setCardNumber] = useState('');
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fatal, setFatal] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.status === 401) {
      router.push(`/login?next=/checkout/${orderId}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFatal(data.error ?? 'Không tải được đơn hàng');
      return;
    }
    setOrder(data);
  }, [orderId, router]);

  const loadMe = useCallback(async () => {
    const r = await fetch('/api/auth/me');
    if (r.ok) setMe(await r.json());
  }, []);

  useEffect(() => {
    load();
    loadMe();
    fetch('/api/payments/methods')
      .then((r) => (r.ok ? r.json() : []))
      .then(setMethods)
      .catch(() => {});
  }, [load, loadMe]);

  // Đang chờ admin duyệt: tự tải lại đơn mỗi 5 giây để hiện key ngay khi được duyệt
  useEffect(() => {
    if (order?.status !== 'AWAITING_CONFIRM') return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [order?.status, load]);

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/payments/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, method, ...(method === 'CARD' && { cardNumber }) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details?.[0]?.message ?? data.error ?? 'Không thanh toán được');

      if (data.redirectUrl) return router.push(data.redirectUrl); // MoMo, ZaloPay, VNPay, PayPal
      if (data.qrDataUrl) return setQr(data); // QR: chờ bấm "đã chuyển khoản"
      await load(); // WALLET, CARD: có kết quả ngay (PAID hoặc FAILED)
      loadMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Khách báo đã chuyển khoản -> đơn chờ admin duyệt
  async function confirmQr() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/payments/transfer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra');
      setQr(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (fatal) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-lg font-bold text-pink">{fatal}</p>
        <Link href="/account" className="mt-4 inline-block font-bold text-miku hover:underline">Về tài khoản →</Link>
      </div>
    );
  }
  if (!order) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-72 animate-pulse rounded-2xl border border-line bg-panel/60" /></div>;
  }

  // ---------- Kết quả theo trạng thái đơn ----------
  if (order.status === 'PAID') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-3 text-3xl font-extrabold text-glow">Thanh toán thành công!</h1>
          <p className="mt-1 text-sm text-muted">Đơn #{order.id} · {formatVnd(order.totalVnd)}</p>
        </div>
        <ul className="mt-8 space-y-3">
          {order.items.map((i) => (
            <li key={i.id} className="rounded-2xl border border-line bg-panel/60 p-4">
              <p className="font-bold">{i.title} <span className="text-xs text-muted">[{i.platform}]</span></p>
              <div className="mt-2 space-y-1.5">
                {i.keys.map((k) => (
                  <code key={k.code} className="block rounded-lg border border-line bg-bg px-3 py-1.5 text-sm tracking-wider text-miku">
                    {k.code}
                  </code>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted">
          Key giả lập, chỉ dùng để học. Bạn cũng xem lại được ở tài khoản, mục "Thư viện key".
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account" className="rounded-full bg-miku px-6 py-2.5 font-bold text-bg hover:brightness-110">Thư viện key</Link>
          <Link href="/games" className="rounded-full border border-miku px-6 py-2.5 font-bold text-miku hover:bg-miku/10">Mua thêm</Link>
        </div>
      </div>
    );
  }

  if (order.status === 'AWAITING_CONFIRM') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-5xl">⏳</p>
        <h1 className="mt-3 text-2xl font-extrabold">Đang chờ xác nhận chuyển khoản</h1>
        <p className="mt-2 text-sm text-muted">
          Đơn #{order.id} · {formatVnd(order.totalVnd)}. Quản trị viên sẽ kiểm tra khoản chuyển và duyệt đơn.
          Trang này tự cập nhật, key sẽ hiện ngay khi đơn được duyệt.
        </p>
        <p className="mt-1 text-xs text-muted">Key của bạn đang được giữ, không bị hết hạn trong lúc chờ.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account" className="rounded-full border border-line px-6 py-2.5 font-bold text-muted hover:border-miku hover:text-miku">Đơn hàng của tôi</Link>
          <Link href="/games" className="rounded-full bg-miku px-6 py-2.5 font-bold text-bg hover:brightness-110">Xem thêm game</Link>
        </div>
      </div>
    );
  }

  if (order.status !== 'PENDING') {
    const info = {
      FAILED: ['Thanh toán thất bại', 'Key đã được trả về kho. Bạn chưa bị trừ tiền.'],
      EXPIRED: ['Đơn hàng đã hết hạn', 'Quá 15 phút chưa thanh toán nên key đã được trả về kho.'],
      REFUNDED: ['Đơn hàng đã hoàn tiền', 'Số tiền đã được hoàn vào Ví Miku.'],
    }[order.status] ?? ['Đơn hàng không còn hiệu lực', ''];
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-5xl">{order.status === 'REFUNDED' ? '↩️' : '😿'}</p>
        <h1 className="mt-3 text-2xl font-extrabold">{info[0]}</h1>
        <p className="mt-1 text-sm text-muted">{info[1]}</p>
        <p className="mt-1 text-xs text-muted">Giỏ hàng đã được làm trống khi tạo đơn, bạn hãy chọn game lại nhé.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/games" className="rounded-full bg-miku px-6 py-2.5 font-bold text-bg hover:brightness-110">Đến cửa hàng</Link>
          <Link href="/account" className="rounded-full border border-line px-6 py-2.5 font-bold text-muted hover:border-miku hover:text-miku">Đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }

  // ---------- Đang chờ thanh toán ----------
  const walletShort = method === 'WALLET' && me && me.walletBalance < order.totalVnd;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        Thanh toán đơn #{order.id}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {qr ? (
            <div className="rounded-2xl border border-line bg-panel/80 p-6 text-center">
              <h2 className="text-xl font-extrabold">Quét mã để chuyển khoản</h2>
              <img src={qr.qrDataUrl} alt="Mã QR thanh toán" className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2" />
              <dl className="mx-auto mt-4 max-w-xs space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Số tiền</dt><dd className="font-bold text-miku">{formatVnd(qr.amountVnd)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Nội dung</dt><dd className="font-bold">{qr.transferNote}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                QR giả lập, không chuyển tiền thật. Sau khi bấm "Tôi đã chuyển khoản", quản trị viên sẽ kiểm tra và duyệt đơn.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button disabled={busy} onClick={confirmQr} className="rounded-full bg-miku px-6 py-2.5 font-bold text-bg hover:brightness-110 disabled:opacity-50">
                  {busy ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                </button>
                <button onClick={() => setQr(null)} className="rounded-full border border-line px-6 py-2.5 font-bold text-muted hover:border-pink hover:text-pink">
                  Đổi phương thức
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-panel/80 p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-miku">Chọn phương thức thanh toán</h2>
              <div className="grid gap-2">
                {methods.map((m) => {
                  const ui = METHOD_UI[m.code] ?? { icon: '💰', hint: '' };
                  return (
                    <button
                      key={m.code}
                      onClick={() => { setMethod(m.code); setError(''); }}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        method === m.code ? 'border-miku bg-miku/10 glow' : 'border-line hover:border-miku/60'
                      }`}
                    >
                      <span className="text-2xl">{ui.icon}</span>
                      <span className="flex-1">
                        <span className="block font-bold">{m.label}</span>
                        <span className="block text-xs text-muted">
                          {m.code === 'WALLET' && me ? `Số dư: ${formatVnd(me.walletBalance)}` : ui.hint}
                        </span>
                      </span>
                      <span className={`h-4 w-4 rounded-full border-2 ${method === m.code ? 'border-miku bg-miku' : 'border-line'}`} />
                    </button>
                  );
                })}
              </div>

              {method === 'CARD' && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-miku">Số thẻ test</label>
                  <input
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className={inputCls}
                  />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => setCardNumber('4242 4242 4242 4242')} className="rounded-full border border-miku px-3 py-1 text-miku hover:bg-miku/10">
                      Điền thẻ thành công
                    </button>
                    <button type="button" onClick={() => setCardNumber('4000 0000 0000 0002')} className="rounded-full border border-pink px-3 py-1 text-pink hover:bg-pink/10">
                      Điền thẻ bị từ chối
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">Chỉ nhập số thẻ test ở trên. Đừng bao giờ nhập số thẻ thật vào dự án học tập.</p>
                </div>
              )}

              {walletShort && (
                <p className="mt-4 text-sm text-pink">
                  Số dư ví không đủ. Hãy nạp thêm ở trang <Link href="/account" className="font-bold underline">Tài khoản</Link> hoặc chọn phương thức khác.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-4 rounded-lg border border-pink/40 bg-pink/10 px-3 py-2 text-sm font-medium text-pink">{error}</p>
              )}

              <button
                disabled={busy || walletShort || (method === 'CARD' && !cardNumber.trim())}
                onClick={pay}
                className="mt-5 w-full rounded-full bg-miku py-3 font-bold text-bg transition hover:brightness-110 hover:glow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Đang xử lý...' : `Thanh toán ${formatVnd(order.totalVnd)}`}
              </button>
            </div>
          )}
          {qr && error && <p role="alert" className="text-sm font-medium text-pink">{error}</p>}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-panel/80 p-5 lg:sticky lg:top-24">
          <OrderTimer expiresAt={order.expiresAt} onExpire={load} />
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="line-clamp-1 font-medium">{i.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><PlatformBadge platform={i.platform} /> × {i.quantity}</span>
                </span>
                <span className="font-bold">{formatVnd(i.unitPriceVnd * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd>{formatVnd(order.subtotalVnd)}</dd></div>
            {order.discountVnd > 0 && (
              <div className="flex justify-between text-pink"><dt>Giảm giá {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatVnd(order.discountVnd)}</dd></div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt className="font-bold">Tổng cộng</dt><dd className="font-extrabold text-miku">{formatVnd(order.totalVnd)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}