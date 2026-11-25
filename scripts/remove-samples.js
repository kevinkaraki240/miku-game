const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const samples = await prisma.game.findMany({
    where: { developer: 'Studio Mẫu' },
    select: {
      id: true,
      title: true,
      editions: { select: { _count: { select: { orderItems: true } } } },
    },
  });

  const deletable = samples.filter((g) => g.editions.every((e) => e._count.orderItems === 0));
  const kept = samples.filter((g) => !deletable.includes(g));

  const res = await prisma.game.deleteMany({ where: { id: { in: deletable.map((g) => g.id) } } });

  console.log(`Đã xóa ${res.count} game mẫu.`);
  if (kept.length) {
    console.log(`Giữ lại ${kept.length} game vì đã nằm trong đơn hàng: ${kept.map((g) => g.title).join(', ')}`);
  }
  console.log(`Còn lại ${await prisma.game.count()} game trong database.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());