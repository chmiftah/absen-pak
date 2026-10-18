/**
 * Date utilities for Indonesian construction payroll cycle (Minggu s/d Sabtu).
 */

export function formatLocalDate(d: Date = new Date()): string {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const date = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${date}`;
}

export function parseLocalDate(str: string): Date {
	const parts = str.split('-').map(Number);
	if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
		return new Date();
	}
	return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Returns the running weekly cycle (Minggu s/d Sabtu).
 * Day 0 (Minggu) starts the week, Day 6 (Sabtu) is the cutoff day.
 */
export function getRunningWeekRange(refDate: Date = new Date()): {
	startStr: string;
	endStr: string;
	cutoffStr: string;
} {
	const day = refDate.getDay(); // 0 is Sunday, 6 is Saturday
	const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - day);
	const end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + (6 - day));

	const startStr = formatLocalDate(start);
	const endStr = formatLocalDate(end);

	return {
		startStr,
		endStr,
		cutoffStr: endStr
	};
}

/**
 * Returns previous week's cycle (Minggu s/d Sabtu).
 */
export function getLastWeekRange(refDate: Date = new Date()): {
	startStr: string;
	endStr: string;
	cutoffStr: string;
} {
	const lastWeekDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 7);
	return getRunningWeekRange(lastWeekDate);
}

/**
 * Returns current month in YYYY-MM format.
 */
export function getCurrentMonthStr(refDate: Date = new Date()): string {
	const year = refDate.getFullYear();
	const month = String(refDate.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

/**
 * Returns start and end date of a given YYYY-MM month.
 */
export function getMonthRange(monthStr: string): { startStr: string; endStr: string } {
	const [year, m] = monthStr.split('-').map(Number);
	if (!year || !m) {
		const nowMonth = getCurrentMonthStr();
		return getMonthRange(nowMonth);
	}
	const lastDay = new Date(year, m, 0).getDate();
	return {
		startStr: `${monthStr}-01`,
		endStr: `${monthStr}-${String(lastDay).padStart(2, '0')}`
	};
}

const BULAN_INDO = [
	'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
	'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatIndoDate(dateStr: string): string {
	if (!dateStr) return '';
	const [y, m, d] = dateStr.split('-').map(Number);
	if (!y || !m || !d) return dateStr;
	return `${d} ${BULAN_INDO[m - 1]} ${y}`;
}
