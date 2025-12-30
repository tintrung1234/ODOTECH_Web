/**
 * Format a date as dd/mm/yyyy for Vietnamese locale by default.
 *
 * @param date   Date object (default: new Date())
 * @param locale Locale string (default: 'vi-VN')
 */
export function formatDate(
  date: Date = new Date(),
  locale: string = 'vi-VN'
): string {
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
