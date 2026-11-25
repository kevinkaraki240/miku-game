'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const PLATFORMS = [
  { value: '', label: 'Tất cả' },
  { value: 'STEAM', label: 'Steam' },
  { value: 'PS5', label: 'PS5' },
  { value: 'PS4', label: 'PS4' },
];

const PRICES = [
  { key: '', label: 'Mọi mức giá', min: '', max: '' },
  { key: 'u200', label: 'Dưới 200.000đ', min: '', max: '200000' },
  { key: '200-500', label: '200.000đ – 500.000đ', min: '200000', max: '500000' },
  { key: '500-1000', label: '500.000đ – 1.000.000đ', min: '500000', max: '1000000' },
  { key: 'o1000', label: 'Trên 1.000.000đ', min: '1000000', max: '' },
];

const SORTS = [
  { value: 'new', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A → Z' },
];

const selectCls =
  'w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none transition focus:border-miku';

export default function Filters({ genres }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  // Giữ ô tìm kiếm đồng bộ khi URL đổi (ví dụ bấm Back)
  useEffect(() => setQ(sp.get('q') ?? ''), [sp]);

  function update(changes) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    }
    next.delete('page'); // đổi bộ lọc thì về trang 1
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const platform = sp.get('platform') ?? '';
  const priceKey =
    PRICES.find((p) => p.min === (sp.get('minPrice') ?? '') && p.max === (sp.get('maxPrice') ?? ''))?.key ?? '';
  const hasFilter = [...sp.keys()].some((k) => k !== 'sort');

  return (
    <aside className="space-y-6 rounded-2xl border border-line bg-panel/60 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
      >
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Tìm kiếm</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tên game..."
          className={selectCls}
        />
      </form>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Nền tảng</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => update({ platform: p.value })}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                platform === p.value
                  ? 'border-miku bg-miku text-bg'
                  : 'border-line text-muted hover:border-miku hover:text-miku'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Thể loại</label>
        <select value={sp.get('genre') ?? ''} onChange={(e) => update({ genre: e.target.value })} className={selectCls}>
          <option value="">Tất cả thể loại</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Khoảng giá</label>
        <select
          value={priceKey}
          onChange={(e) => {
            const p = PRICES.find((x) => x.key === e.target.value);
            update({ minPrice: p.min, maxPrice: p.max });
          }}
          className={selectCls}
        >
          {PRICES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-miku">Sắp xếp</label>
        <select value={sp.get('sort') ?? 'new'} onChange={(e) => update({ sort: e.target.value })} className={selectCls}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <button
          onClick={() => {
            const sort = sp.get('sort');
            router.push(sort ? `${pathname}?sort=${sort}` : pathname);
          }}
          className="w-full rounded-xl border border-pink/50 py-2 text-sm font-bold text-pink transition hover:bg-pink/10"
        >
          Xóa bộ lọc
        </button>
      )}
    </aside>
  );
}