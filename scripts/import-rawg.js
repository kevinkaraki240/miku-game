const { PrismaClient } = require('@prisma/client');
const { addEditions } = require('../prisma/helpers');

const prisma = new PrismaClient();
const KEY = process.env.RAWG_API_KEY;
const PLATFORM_MAP = { pc: 'STEAM', playstation4: 'PS4', playstation5: 'PS5' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.rawg.io/api${path}${sep}key=${KEY}`);
  if (!res.ok) throw new Error(`RAWG ${res.status} tại ${path}`);
  return res.json();
}

async function main() {
  if (!KEY) throw new Error('Thiếu RAWG_API_KEY trong .env');
  let added = 0;
  for (let page = 1; page <= 6; page++) {
    // platforms: 4 = PC, 18 = PS4, 187 = PS5
    const list = await api(`/games?platforms=4,18,187&ordering=-added&page_size=40&page=${page}`);
    for (const g of list.results) {
      if (await prisma.game.findUnique({ where: { slug: g.slug } })) continue;
      const platforms = [...new Set(g.platforms.map((p) => PLATFORM_MAP[p.platform.slug]).filter(Boolean))];
      if (!platforms.length || !g.background_image) continue;

      const detail = await api(`/games/${g.id}`);
      await sleep(200);
      const game = await prisma.game.create({
        data: {
          slug: g.slug,
          title: g.name,
          description: (detail.description_raw || '').slice(0, 2000),
          coverUrl: g.background_image,
          backgroundUrl: g.background_image,
          screenshots: JSON.stringify((g.short_screenshots || []).map((s) => s.image)),
          genres: (g.genres || []).map((x) => x.name).join(','),
          developer: detail.developers?.[0]?.name ?? null,
          releaseDate: g.released ? new Date(g.released) : null,
          rating: g.rating || 0,
        },
      });
      await addEditions(prisma, game.id, platforms);
      added++;
      console.log(`+ ${g.name} [${platforms.join(', ')}]`);
    }
  }
  console.log(`Đã thêm ${added} game.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());