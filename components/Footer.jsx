import Link from 'next/link';
import Logo from './Logo';
import { BRAND } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-panel/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Logo name={BRAND.name} />
          <p className="mt-3 max-w-xs text-sm text-muted">{BRAND.tagline}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-miku">Cửa hàng</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/games" className="hover:text-miku">Tất cả game</Link></li>
            <li><Link href="/games?platform=STEAM" className="hover:text-miku">Game Steam (PC)</Link></li>
            <li><Link href="/games?platform=PS5" className="hover:text-miku">Game PS5</Link></li>
            <li><Link href="/games?platform=PS4" className="hover:text-miku">Game PS4</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-miku">Lưu ý</h3>
          <p className="text-sm text-muted">
            {BRAND.name} là dự án học tập cá nhân. Thanh toán, giá bán và key game đều là giả lập,
            không có giao dịch thật.
          </p>
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-xs text-muted">
        Dữ liệu game từ{' '}
        <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" className="text-miku hover:underline">
          RAWG
        </a>
        . Tên và nhãn Steam, PlayStation thuộc về chủ sở hữu tương ứng.
      </div>
    </footer>
  );
}