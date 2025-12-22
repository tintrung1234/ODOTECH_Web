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

