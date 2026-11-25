import { describe, it, expect } from 'vitest';
import { effectivePrice, applyCoupon } from '../lib/pricing';

const future = new Date(Date.now() + 86400000);
const past = new Date(Date.now() - 86400000);

describe('effectivePrice', () => {
  it('giảm giá khi đang sale', () => {
    expect(effectivePrice({ priceVnd: 500000, discountPercent: 20, saleEndsAt: future })).toBe(400000);
  });
  it('về giá gốc khi sale đã hết hạn', () => {
    expect(effectivePrice({ priceVnd: 500000, discountPercent: 20, saleEndsAt: past })).toBe(500000);
  });
});

describe('applyCoupon', () => {
  const coupon = { active: true, percentOff: 10, maxDiscountVnd: 100000, minOrderVnd: 0, usageLimit: null, usedCount: 0, expiresAt: null };
  it('tính phần trăm', () => expect(applyCoupon(coupon, 500000)).toBe(50000));
  it('chặn bởi mức giảm tối đa', () => expect(applyCoupon(coupon, 5000000)).toBe(100000));
  it('báo lỗi khi mã hết hạn', () => {
    expect(() => applyCoupon({ ...coupon, expiresAt: past }, 500000)).toThrow();
  });
});