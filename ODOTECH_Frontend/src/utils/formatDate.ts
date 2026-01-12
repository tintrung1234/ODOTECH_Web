/**
 * Format a date as dd/mm/yyyy for Vietnamese locale by default.
 *
 * @param date   Date object (default: new Date())
 * @param locale Locale string (default: 'vi-VN')
 */
export function formatDate(
  date: Date | string | number = new Date(),
  _locale: string = 'vi-VN' // Kept for compatibility but unused for format
): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(
  date: Date | string | number = new Date()
): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const calculateDaysDiff = (dateString?: string): number => {
  if (!dateString) return 0;

  const target = new Date(dateString);
  const now = new Date();

  const diffTime = Math.abs(now.getTime() - target.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeeksDiff = (startDate?: string): string => {
  if (!startDate) return '0.0';

  const days = calculateDaysDiff(startDate);
  return (days / 7).toFixed(1);
};
