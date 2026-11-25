const crypto = require('crypto');

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const pick = () => ALPHA[crypto.randomInt(ALPHA.length)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// Key GIẢ dạng XXXXX-XXXXX-XXXXX, không dùng được ở đâu cả
const makeKey = () =>
  Array.from({ length: 3 }, () => Array.from({ length: 5 }, pick).join('')).join('-');

// Tạo phiên bản (Steam/PS4/PS5) cho một game kèm giá, giảm giá ngẫu nhiên và 15 key giả
async function addEditions(prisma, gameId, platforms) {
  const base = rnd(99, 1499) * 1000;
  for (const platform of platforms) {
    const factor = platform === 'PS5' ? 1.1 : platform === 'PS4' ? 0.9 : 1;
    const onSale = Math.random() < 0.35;
    const edition = await prisma.edition.create({
      data: {
        gameId,
        platform,
        priceVnd: Math.round((base * factor) / 1000) * 1000,
        discountPercent: onSale ? [10, 20, 30, 50, 70][rnd(0, 4)] : 0,
        saleEndsAt: onSale ? new Date(Date.now() + rnd(1, 5) * 86400000) : null,
      },
    });
    await prisma.gameKey.createMany({
      data: Array.from({ length: 15 }, () => ({ editionId: edition.id, code: makeKey() })),
    });
  }
}

module.exports = { addEditions, rnd, makeKey };