/**
 * Format a date as dd/mm/yyyy for Vietnamese locale by default.
 *
 * @param {Date} [date]
 * @param {string} [locale]
 */
export function formatDate(date = new Date(), locale = 'vi-VN') {
	return date.toLocaleDateString(locale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const calculateDaysDiff = (dateString) => {
  if (!dateString) return 0;
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - target.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const getWeeksDiff = (startDate) => {
  if (!startDate) return 0;
  const days = calculateDaysDiff(startDate);
  return (days / 7).toFixed(1);
};