'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { BRAND } from '@/lib/config';

const LINKS = [
  { href: '/games', label: 'Cửa hàng' },
  { href: '/games?platform=STEAM', label: 'Steam' },
  { href: '/games?platform=PS5', label: 'PlayStation' },
];

export default function Navbar() {
  const router = useRouter();
  const box = useRef(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Lấy người dùng đang đăng nhập (nếu có) và số món trong giỏ
    // Lấy người dùng + số món trong giỏ; tải lại khi đăng nhập hoặc giỏ hàng thay đổi
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const me = await fetch('/api/auth/me');
        if (!alive) return;
        if (!me.ok) {
          setUser(null);
          setCartCount(0);
          return;
        }
        setUser(await me.json());
        const cart = await fetch('/api/cart');
        if (cart.ok && alive) {
          const data = await cart.json();
          setCartCount(data.items.reduce((s, i) => s + i.quantity, 0));
        }
      } catch {}
    }
    load();
    window.addEventListener('auth:changed', load);
    window.addEventListener('cart:changed', load);
    return () => {
      alive = false;
      window.removeEventListener('auth:changed', load);
      window.removeEventListener('cart:changed', load);
    };
  }, []);

  // Gợi ý khi gõ (đợi 250ms sau lần gõ cuối để không gọi API liên tục)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/games/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (r.ok) setResults(await r.json());
      } catch {}
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  // Bấm ra ngoài thì đóng khung gợi ý
  useEffect(() => {
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/games?q=${encodeURIComponent(term)}`);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCartCount(0);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" aria-label={BRAND.name}>
          <Logo name={BRAND.name} />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-panel hover:text-miku"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Ô tìm kiếm */}
        <div ref={box} className="relative ml-auto hidden max-w-md flex-1 md:block">
          <form onSubmit={submit}>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Tìm game..."
              className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-miku focus:glow"
            />
          </form>
          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-line bg-panel shadow-xl"
              >
                {results.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/games/${g.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-miku/10"
                    >
                      <img src={g.coverUrl} alt="" className="h-12 w-9 rounded object-cover" />
                      <span className="text-sm font-medium">{g.title}</span>
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
                      <Link
            href="/wishlist"
            aria-label="Yêu thích"
            className="hidden h-10 w-10 place-items-center rounded-full border border-line bg-panel transition hover:border-pink hover:text-pink sm:grid"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </Link>
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-panel transition hover:border-miku hover:text-miku"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M2 3h3l2.7 11.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 7H6" />
            </svg>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-[11px] font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
                 {user.role === 'ADMIN' && (
                <Link href="/admin" className="rounded-full border border-pink/60 px-3 py-1.5 text-sm font-bold text-pink transition hover:bg-pink/10">
                  Quản trị
                </Link>
              )}
              <Link href="/account" className="max-w-32 truncate text-sm font-medium hover:text-miku">
                {user.name}
              </Link>
              <button onClick={logout} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-pink hover:text-pink">
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-miku px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110 hover:glow sm:block"
            >
              Đăng nhập
            </Link>
          )}

          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={menu ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu trên điện thoại */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <form onSubmit={submit} className="mb-2 md:hidden">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm game..."
                  className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm outline-none focus:border-miku"
                />
              </form>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 font-medium hover:bg-panel hover:text-miku">
                  {l.label}
                </Link>
              ))}
              {user ? (
                <button onClick={logout} className="rounded-lg px-3 py-2 text-left font-medium text-pink hover:bg-panel">
                  Đăng xuất ({user.name})
                </button>
              ) : (
                <Link href="/login" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 font-bold text-miku hover:bg-panel">
                  Đăng nhập
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}