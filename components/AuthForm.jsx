'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { safeNext } from '@/lib/safeNext';

const inputCls =
  'w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-miku';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get('next'));
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin
            ? { email: form.email, password: form.password }
            : { email: form.email, name: form.name, password: form.password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Lỗi kiểm tra dữ liệu có danh sách chi tiết, lấy lỗi đầu tiên cho dễ đọc
        throw new Error(data.details?.[0]?.message ?? data.error ?? 'Có lỗi xảy ra');
      }
      window.dispatchEvent(new Event('auth:changed')); // báo thanh điều hướng cập nhật
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-line bg-panel/80 p-8 backdrop-blur">
        <h1 className="text-3xl font-extrabold text-glow">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isLogin ? 'Chào mừng trở lại!' : 'Chỉ mất vài giây để bắt đầu.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-miku">Tên hiển thị</label>
              <input required minLength={2} maxLength={50} value={form.name} onChange={set('name')} className={inputCls} />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-miku">Email</label>
            <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-miku">Mật khẩu</label>
            <input
              required
              type="password"
              minLength={isLogin ? 1 : 8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
              className={inputCls}
            />
            {!isLogin && <p className="mt-1 text-xs text-muted">Tối thiểu 8 ký tự.</p>}
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-pink/40 bg-pink/10 px-3 py-2 text-sm font-medium text-pink">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="w-full rounded-full bg-miku py-3 font-bold text-bg transition hover:brightness-110 hover:glow disabled:opacity-50"
          >
            {busy ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <Link
            href={`${isLogin ? '/register' : '/login'}${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-bold text-miku hover:underline"
          >
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </Link>
        </p>
      </div>
    </div>
  );
}