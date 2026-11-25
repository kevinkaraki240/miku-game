import GameSection from '@/components/GameSection';
import Hero from '@/components/Hero';
import Countdown from '@/components/Countdown';
import { getHomeData } from '@/lib/home';

// Dữ liệu và giờ khuyến mãi thay đổi liên tục, nên luôn lấy mới khi có người vào
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Chuyển qua JSON để ngày giờ thành chuỗi, truyền sang client component an toàn
  const data = JSON.parse(JSON.stringify(await getHomeData()));

  // Thời điểm kết thúc sớm nhất trong các đợt giảm giá đang chạy
  const saleEnds = data.flashSale
    .flatMap((g) => g.editions.map((e) => e.saleEndsAt))
    .filter(Boolean)
    .sort()[0];

  return (
    <>
      <Hero items={data.topRated.slice(0, 5)} />

      <GameSection
        title="Flash Sale"
        subtitle="Giảm giá có hạn, nhanh tay kẻo hết"
        href="/games?sort=new"
        games={data.flashSale}
        extra={saleEnds && <Countdown endsAt={saleEnds} />}
      />
      <GameSection title="Mới phát hành" href="/games?sort=new" games={data.newest} />
      <GameSection title="Đánh giá cao" href="/games?sort=rating" games={data.topRated} />
      <GameSection title="Sắp ra mắt" subtitle="Đặt lịch chờ game bạn mong đợi" games={data.upcoming} upcoming />
    </>
  );
}