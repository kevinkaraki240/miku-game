'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TABS = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/orders', label: 'Đơn hàng' },
  { href: '/admin/inventory', label: 'Kho & giá' },
];

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState('loading'); // loading | ok | forbidden

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) return router.push('/login?next=/admin');
      const me = await res.json().catch(() => ({}));
      setState(me.role === 'ADMIN' ? 'ok' : 'forbidden');
    })();
  }, [router]);

  if (state === 'loading') {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-64 animate-pulse rounded-2xl border border-line bg-panel/60" /></div>;
  }
  if (state === 'forbidden') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-3 text-2xl font-extrabold">Bạn không có quyền vào khu vực này</h1>
        <p className="mt-1 text-sm text-muted">Hãy đăng nhập bằng tài khoản quản trị viên.</p>
        <Link href="/" className="mt-5 inline-block font-bold text-miku hover:underline">Về trang chủ →</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-miku to-pink align-middle" />
        Quản trị
      </h1>
      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                active ? 'border-miku bg-miku text-bg' : 'border-line text-muted hover:border-miku hover:text-miku'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}