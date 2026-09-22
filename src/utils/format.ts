export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/** Chơi quá 3 giờ thì mỗi giờ vượt ngưỡng được giảm 5.000đ (phải khớp với TableService.CalculateTableFee ở backend) */
/** Bật/tắt giảm giá theo giờ chơi. Đang TẮT tạm thời - đổi thành true để bật lại (phải khớp với DiscountEnabled ở backend) */
export const DISCOUNT_ENABLED = false;
export const DISCOUNT_THRESHOLD_MINUTES = 180;
export const DISCOUNT_PER_HOUR = 5000;

export type SessionFee = {
  /** Số phút đã chơi */
  minutes: number;
  /** Tiền bàn sau khi đã trừ giảm giá giờ chơi */
  amount: number;
  /** Số tiền được giảm do chơi trên 3 giờ */
  discount: number;
};

/** Tính tiền bàn tạm tính kèm số tiền đã được giảm theo giờ chơi */
export const calcSessionFee = (openedAt: string, hourlyRate: number): SessionFee => {
  const minutes = Math.max((Date.now() - new Date(openedAt).getTime()) / 60000, 0);
  const fullAmount = Math.floor((minutes / 60) * hourlyRate);

  if (!DISCOUNT_ENABLED || minutes <= DISCOUNT_THRESHOLD_MINUTES)
    return { minutes, amount: fullAmount, discount: 0 };

  const discountedRate = Math.max(hourlyRate - DISCOUNT_PER_HOUR, 0);
  const extraMinutes = minutes - DISCOUNT_THRESHOLD_MINUTES;
  const amount = Math.floor(
    (DISCOUNT_THRESHOLD_MINUTES / 60) * hourlyRate + (extraMinutes / 60) * discountedRate
  );

  return { minutes, amount, discount: fullAmount - amount };
};

export const calcCurrentAmount = (openedAt: string, hourlyRate: number) =>
  calcSessionFee(openedAt, hourlyRate).amount;
