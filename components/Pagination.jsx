import Link from 'next/link';

// Trả về dãy số trang, chèn '…' khi quá dài. Ví dụ: 1 … 4 5 6 … 20
function pagesToShow(page, total) {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const list = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;

  const base = 'grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-medium transition';
  const idle = 'border-line text-muted hover:border-miku hover:text-miku';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${base} ${idle}`}>← Trước</Link>
      )}
      {pagesToShow(page, totalPages).map((n, i) =>
        n === '…' ? (
          <span key={`gap${i}`} className="px-1 text-muted">…</span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${base} ${n === page ? 'border-miku bg-miku font-bold text-bg' : idle}`}
          >
            {n}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={`${base} ${idle}`}>Sau →</Link>
      )}
    </nav>
  );
}