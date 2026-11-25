const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { addEditions, rnd } = require('./helpers');

const prisma = new PrismaClient();

const ADJ = ['Neon', 'Crystal', 'Echo', 'Starlight', 'Teal', 'Pixel', 'Virtual', 'Midnight', 'Rhythm', 'Aurora'];
const NOUN = ['Horizon', 'Chronicles', 'Odyssey', 'Legends', 'Run', 'Protocol'];
const GENRES = ['Action', 'RPG', 'Adventure', 'Strategy', 'Racing', 'Rhythm', 'Simulation', 'Shooter', 'Puzzle', 'Indie'];
const PLATFORM_SETS = [['STEAM'], ['STEAM', 'PS5'], ['STEAM', 'PS4', 'PS5'], ['PS4', 'PS5'], ['PS5'], ['STEAM', 'PS4']];

async function main() {
  // Tài khoản mẫu (CHỈ DÙNG KHI PHÁT TRIỂN)
  await prisma.user.upsert({
    where: { email: 'admin@mikugame.local' },
    update: {},
    create: { email: 'admin@mikugame.local', name: 'Admin', role: 'ADMIN', passwordHash: await bcrypt.hash('Admin@12345', 10) },
  });
  await prisma.user.upsert({
    where: { email: 'user@mikugame.local' },
    update: {},
    create: { email: 'user@mikugame.local', name: 'Người dùng mẫu', walletBalance: 5_000_000, passwordHash: await bcrypt.hash('User@12345', 10) },
  });

  // Mã giảm giá
  await prisma.coupon.upsert({
    where: { code: 'MIKU10' },
    update: {},
    create: { code: 'MIKU10', percentOff: 10, maxDiscountVnd: 100_000 },
  });
  await prisma.coupon.upsert({
    where: { code: 'TEAL20' },
    update: {},
    create: { code: 'TEAL20', percentOff: 20, maxDiscountVnd: 200_000, minOrderVnd: 500_000 },
  });

  // 60 game mẫu
  for (let i = 0; i < 60; i++) {
    const title = `${ADJ[i % 10]} ${NOUN[Math.floor(i / 10)]}`;
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    if (await prisma.game.findUnique({ where: { slug } })) continue;

    const genres = [...GENRES].sort(() => Math.random() - 0.5).slice(0, 2).join(',');
    const game = await prisma.game.create({
      data: {
        slug,
        title,
        description: `${title} là tựa game mẫu thuộc thể loại ${genres}, dùng để thử nghiệm giao diện cửa hàng.`,
        coverUrl: `https://picsum.photos/seed/${slug}/600/800`,
        backgroundUrl: `https://picsum.photos/seed/${slug}-bg/1600/800`,
        screenshots: JSON.stringify([1, 2, 3].map((n) => `https://picsum.photos/seed/${slug}-${n}/1280/720`)),
        genres,
        developer: 'Studio Mẫu',
        rating: rnd(30, 50) / 10,
        releaseDate: new Date(Date.now() + rnd(-1000, 60) * 86400000), // một số game "sắp ra mắt"
      },
    });
    await addEditions(prisma, game.id, PLATFORM_SETS[rnd(0, PLATFORM_SETS.length - 1)]);
  }
  console.log('Seed xong.');
}

main().finally(() => prisma.$disconnect());