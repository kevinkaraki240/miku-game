import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { prisma } from './db';
import { HttpError } from './http';
import { POINTS_PER_VND } from './config';
import { expireStaleOrders, failOrder } from './orders';
import { sendOrderEmail } from './mailer';

export const METHODS = {
  QR_BANK: 'Chuyển khoản QR',
  MOMO: 'Ví MoMo',
  ZALOPAY: 'ZaloPay',
  VNPAY: 'VNPay',
  CARD: 'Thẻ Visa/Mastercard',
  PAYPAL: 'PayPal',
  WALLET: 'Ví Miku',
};

const TEST_CARDS = { '4242424242424242': 'SUCCESS', '4000000000000002': 'FAILED' };

// Đánh dấu đã thanh toán: key -> SOLD, cộng điểm thưởng, tăng lượt dùng coupon
export async function markPaid(tx, orderId, paymentId) {
  const order = await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
  await tx.payment.update({ where: { id: paymentId }, data: { status: 'SUCCEEDED', paidAt: new Date() } });
  await tx.gameKey.updateMany({
    where: { orderItem: { orderId }, status: 'RESERVED' },
    data: { status: 'SOLD' },
  });
  await tx.user.update({
    where: { id: order.userId },
    data: { points: { increment: Math.floor(order.totalVnd / POINTS_PER_VND) } },
  });
  if (order.couponCode) {
    await tx.coupon.update({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
  }
}

export async function startPayment(user, { orderId, method, cardNumber }) {
  if (!METHODS[method]) throw new HttpError(400, 'Phương thức thanh toán không được hỗ trợ');
  await expireStaleOrders();

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.status !== 'PENDING') throw new HttpError(409, `Đơn đang ở trạng thái ${order.status}`);

  // Cho phép đổi phương thức: ghi đè giao dịch đang chờ
  const providerRef = `${method}-${randomUUID().slice(0, 12)}`;
  const payment = await prisma.payment.upsert({
    where: { orderId },
    create: { orderId, method, amountVnd: order.totalVnd, providerRef },
    update: { method, providerRef, status: 'INITIATED' },
  });

  if (method === 'WALLET') {
    await prisma.$transaction(async (tx) => {
      // Trừ tiền chỉ khi đủ số dư (điều kiện nằm ngay trong câu lệnh nên không bị trừ âm)
      const r = await tx.user.updateMany({
        where: { id: user.id, walletBalance: { gte: order.totalVnd } },
        data: { walletBalance: { decrement: order.totalVnd } },
      });
      if (r.count === 0) throw new HttpError(402, 'Số dư ví không đủ');
      await markPaid(tx, orderId, payment.id);
    });
    await sendOrderEmail(orderId);
    return { orderId, status: 'PAID', method, providerRef };
  }

  if (method === 'CARD') {
    const result = TEST_CARDS[String(cardNumber ?? '').replace(/\s/g, '')];
    if (!result) {
      throw new HttpError(400, 'Hãy dùng thẻ test: 4242 4242 4242 4242 (thành công) hoặc 4000 0000 0000 0002 (bị từ chối)');
    }
    return settlePayment(providerRef, result);
  }

  if (method === 'QR_BANK') {
    const note = `MIKU${orderId}`;
    const qrDataUrl = await QRCode.toDataURL(`MIKUGAME|${note}|${order.totalVnd}`);
    return { orderId, status: 'PENDING', method, providerRef, transferNote: note, amountVnd: order.totalVnd, qrDataUrl, expiresAt: order.expiresAt };
  }

  // MOMO, ZALOPAY, VNPAY, PAYPAL: chuyển sang trang cổng giả lập
  return { orderId, status: 'PENDING', method, providerRef, redirectUrl: `/pay/mock/${providerRef}`, expiresAt: order.expiresAt };
}

// Nhận kết quả từ "cổng": result = 'SUCCESS' | 'FAILED'. Gọi nhiều lần vẫn an toàn (idempotent).
export async function settlePayment(providerRef, result, userId) {
  await expireStaleOrders();

  const out = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { providerRef }, include: { order: true } });
    if (!payment) throw new HttpError(404, 'Không tìm thấy giao dịch');

    // Chuyển khoản ngân hàng chỉ admin (hoặc webhook ngân hàng) mới được xác nhận
    if (userId && payment.method === 'QR_BANK') {
      throw new HttpError(403, 'Chuyển khoản cần admin duyệt, bạn không thể tự xác nhận');
    }
    if (userId && payment.order.userId !== userId) throw new HttpError(403, 'Không phải giao dịch của bạn');

    if (payment.status !== 'INITIATED') {
      return { orderId: payment.orderId, status: payment.order.status, alreadySettled: true };
    }
    if (result === 'SUCCESS') {
      await markPaid(tx, payment.orderId, payment.id);
      return { orderId: payment.orderId, status: 'PAID' };
    }
    await failOrder(tx, payment.orderId, 'FAILED');
    return { orderId: payment.orderId, status: 'FAILED' };
  });

  if (out.status === 'PAID' && !out.alreadySettled) await sendOrderEmail(out.orderId);
  return out;
}

// Khách báo "đã chuyển khoản": đơn chuyển sang chờ admin duyệt
export async function claimTransfer(user, orderId) {
  await expireStaleOrders();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId: user.id }, include: { payment: true } });
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (order.status === 'AWAITING_CONFIRM') return; // bấm lại vẫn an toàn
    if (order.status !== 'PENDING') throw new HttpError(409, `Đơn đang ở trạng thái ${order.status}`);
    if (!order.payment || order.payment.method !== 'QR_BANK' || order.payment.status !== 'INITIATED') {
      throw new HttpError(400, 'Hãy chọn Chuyển khoản QR trước');
    }
    await tx.order.update({ where: { id: orderId }, data: { status: 'AWAITING_CONFIRM' } });
    await tx.payment.update({ where: { orderId }, data: { status: 'AWAITING_CONFIRM' } });
  });
  return { orderId, status: 'AWAITING_CONFIRM' };
}

// Admin duyệt: đã nhận tiền -> đơn thành công, key giao cho khách
export async function approveTransfer(orderId) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (order.status !== 'AWAITING_CONFIRM' || !order.payment) {
      throw new HttpError(409, 'Đơn này không ở trạng thái chờ duyệt');
    }
    await markPaid(tx, orderId, order.payment.id);
  });
  await sendOrderEmail(orderId);
  return { orderId, status: 'PAID' };
}

// Admin từ chối: không thấy tiền -> đơn thất bại, key trả về kho
export async function rejectTransfer(orderId) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (order.status !== 'AWAITING_CONFIRM') throw new HttpError(409, 'Đơn này không ở trạng thái chờ duyệt');
    await failOrder(tx, orderId, 'FAILED');
  });
  return { orderId, status: 'FAILED' };
}