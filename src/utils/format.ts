export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const calcCurrentAmount = (openedAt: string, hourlyRate: number) => {
  const minutes = (Date.now() - new Date(openedAt).getTime()) / 60000;
  return Math.floor((minutes / 60) * hourlyRate);
};
