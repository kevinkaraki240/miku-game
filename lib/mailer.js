import { prisma } from './db';

export async function sendOrderEmail(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { keys: true } } },
  });
  if (!order) return;
  const lines = order.items.flatMap((i) => i.keys.map((k) => `  - ${i.title} [${i.platform}]: ${k.code}`));
  console.log(
    `\n📧 Gửi tới ${order.user.email}\n` +
    `Đơn #${order.id} đã thanh toán ${order.totalVnd.toLocaleString('vi-VN')}đ. Key của bạn:\n${lines.join('\n')}\n`
  );
}