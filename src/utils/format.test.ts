import { describe, it, expect } from 'vitest';
import { formatCurrency, formatTime, calcCurrentAmount, calcSessionFee, DISCOUNT_ENABLED } from './format';

// 1 "describe" = 1 nhóm test, gom các test liên quan đến cùng 1 hàm/module
describe('formatCurrency', () => {
  // 1 "it" = 1 trường hợp cụ thể. Tên nên mô tả HÀNH VI, không phải "test 1"
  it('formats a positive number as VND currency', () => {
    // Arrange: chuẩn bị input
    const amount = 50000;

    // Act: gọi hàm cần test
    const result = formatCurrency(amount);

    // Assert: kiểm tra output có đúng như kỳ vọng không
    expect(result).toContain('50.000');
    expect(result).toContain('₫');
  });

  it('formats zero as 0 VND', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});

describe('formatTime', () => {
  it('returns only minutes when under 1 hour', () => {
    expect(formatTime(45)).toBe('45m');
  });

  it('returns hours and minutes when over 1 hour', () => {
    expect(formatTime(90)).toBe('1h 30m');
  });

  it('returns 0m for zero minutes', () => {
    expect(formatTime(0)).toBe('0m');
  });
});

describe('calcCurrentAmount', () => {
  it('calculates 0 when the table just opened (0 minutes elapsed)', () => {
    const openedAt = new Date().toISOString();
    const hourlyRate = 60000;

    const result = calcCurrentAmount(openedAt, hourlyRate);

    expect(result).toBe(0);
  });

  it('calculates half the hourly rate after ~30 minutes', () => {
    const openedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const hourlyRate = 60000;

    const result = calcCurrentAmount(openedAt, hourlyRate);

    // Cho phép sai số nhỏ vì thời gian test chạy có độ trễ vài ms
    expect(result).toBeGreaterThanOrEqual(29000);
    expect(result).toBeLessThanOrEqual(30000);
  });
});

const openedMinutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

describe('calcSessionFee - khi tắt giảm giá theo giờ chơi', () => {
  it.skipIf(DISCOUNT_ENABLED)('không giảm giá dù chơi trên 3 giờ', () => {
    const fee = calcSessionFee(openedMinutesAgo(300), 60000);

    expect(fee.discount).toBe(0);
    expect(fee.amount).toBeGreaterThanOrEqual(299000);
    expect(fee.amount).toBeLessThanOrEqual(300000);
  });
});

// Các test dưới đây chỉ chạy khi bật lại giảm giá (DISCOUNT_ENABLED = true)
describe.skipIf(!DISCOUNT_ENABLED)('calcSessionFee - giảm giá khi chơi trên 3 giờ', () => {
  const hourlyRate = 60000;

  it('không giảm giá khi chơi dưới 3 giờ', () => {
    const fee = calcSessionFee(openedMinutesAgo(120), hourlyRate);

    expect(fee.discount).toBe(0);
    expect(fee.amount).toBeGreaterThanOrEqual(119000);
    expect(fee.amount).toBeLessThanOrEqual(120000);
  });

  it('giảm 5.000đ cho mỗi giờ vượt mốc 3 giờ', () => {
    // 5 giờ: 3 giờ giá gốc + 2 giờ giá giảm => giảm 2 x 5.000 = 10.000
    const fee = calcSessionFee(openedMinutesAgo(300), hourlyRate);

    expect(fee.discount).toBeGreaterThanOrEqual(9900);
    expect(fee.discount).toBeLessThanOrEqual(10100);
    expect(fee.amount).toBeGreaterThanOrEqual(289000);
    expect(fee.amount).toBeLessThanOrEqual(290100);
  });

  it('không giảm quá giá thuê khi giá bàn thấp hơn mức giảm', () => {
    const fee = calcSessionFee(openedMinutesAgo(300), 4000);

    // Giá giảm không âm => tiền 2 giờ vượt mốc bằng 0
    expect(fee.amount).toBeGreaterThanOrEqual(11900);
    expect(fee.amount).toBeLessThanOrEqual(12100);
  });
});
