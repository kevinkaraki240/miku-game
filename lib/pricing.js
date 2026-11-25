import { HttpError } from './http';

export function isOnSale(e, now = new Date()) {
  return e.discountPercent > 0 && (!e.saleEndsAt || e.saleEndsAt > now);
}

// Giá cuối cùng, làm tròn đến nghìn đồng
export function effectivePrice(e, now = new Date()) {
  if (!isOnSale(e, now)) return e.priceVnd;
  return Math.round((e.priceVnd * (100 - e.discountPercent)) / 100 / 1000) * 1000;
}

export function applyCoupon(coupon, subtotal, now = new Date()) {
  if (!coupon || !coupon.active) throw new HttpError(400, 'Mã giảm giá không tồn tại');
  if (coupon.expiresAt && coupon.expiresAt < now) throw new HttpError(400, 'Mã giảm giá đã hết hạn');
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    throw new HttpError(400, 'Mã giảm giá đã hết lượt dùng');
  if (subtotal < coupon.minOrderVnd)
    throw new HttpError(400, `Đơn tối thiểu ${coupon.minOrderVnd.toLocaleString('vi-VN')}đ để dùng mã này`);

  let discount = Math.floor((subtotal * coupon.percentOff) / 100);
  if (coupon.maxDiscountVnd != null) discount = Math.min(discount, coupon.maxDiscountVnd);
  return Math.min(discount, subtotal);
}