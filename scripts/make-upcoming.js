const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Lấy 4 game có đánh giá cao nhất rồi dời ngày phát hành sang tương lai
  const games = await prisma.game.findMany({ orderBy: { rating: 'desc' }, take: 4, select: { id: true, title: true } });
  for (const [i, g] of games.entries()) {
    const days = 15 + i * 20; // 15, 35, 55, 75 ngày nữa
    await prisma.game.update({
      where: { id: g.id },
      data: { releaseDate: new Date(Date.now() + days * 86400000) },
    });
    console.log(`${g.title} -> ra mắt sau ${days} ngày`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());