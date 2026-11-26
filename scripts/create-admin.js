const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const [email, password, name = 'Admin'] = process.argv.slice(2);

async function main() {
  if (!email || !password || password.length < 12) {
    throw new Error('Cách dùng: npm run create:admin -- email matkhau(>=12 ký tự) [tên]');
  }
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: 'ADMIN', passwordHash: hash },
    create: { email: email.toLowerCase(), name, role: 'ADMIN', passwordHash: hash },
  });
  await prisma.coupon.upsert({
    where: { code: 'MIKU10' },
    update: {},
    create: { code: 'MIKU10', percentOff: 10, maxDiscountVnd: 100_000 },
  });
  console.log('Đã tạo admin và mã MIKU10.');
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());