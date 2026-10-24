import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import {
	formatLocalDate,
	parseLocalDate,
	getRunningWeekRange,
	getCurrentMonthStr,
	getMonthRange
} from '$lib/dateUtils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	const projects = await sql`
		SELECT id, nama_projek, lokasi, status FROM absen_projek ORDER BY id ASC;
	`;

	const selectedProjekId = url.searchParams.get('projek_id') ? Number(url.searchParams.get('projek_id')) : (projects[0]?.id || 1);
	const [selectedProjek] = projects.filter(p => p.id === selectedProjekId);

	// Period Mode: 'mingguan' | 'bulanan' | 'custom'
	const mode = url.searchParams.get('mode') || 'mingguan';

	let startDateStr = '';
	let endDateStr = '';

	const runningWeek = getRunningWeekRange();

	if (mode === 'mingguan') {
		// Default to running week's cutoff (Sabtu) or query param
		const cutoffParam = url.searchParams.get('cutoff');
		const end = cutoffParam ? parseLocalDate(cutoffParam) : parseLocalDate(runningWeek.cutoffStr);
		// 6 days before end date -> 7 days total (Minggu s/d Sabtu)
		const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);

		startDateStr = formatLocalDate(start);
		endDateStr = formatLocalDate(end);
	} else if (mode === 'bulanan') {
		const monthParam = url.searchParams.get('bulan') || getCurrentMonthStr();
		const range = getMonthRange(monthParam);
		startDateStr = range.startStr;
		endDateStr = range.endStr;
	} else {
		// Custom date range: default to running week
		startDateStr = url.searchParams.get('start_date') || runningWeek.startStr;
		endDateStr = url.searchParams.get('end_date') || runningWeek.endStr;
	}

	// Generate array of day columns in the range
	const dayColumns: { dateStr: string; dayName: string; dayLabel: string }[] = [];
	const startObj = parseLocalDate(startDateStr);
	const endObj = parseLocalDate(endDateStr);

	const dayNamesIndo = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

	const current = new Date(startObj);
	while (current <= endObj) {
		const dateStr = formatLocalDate(current);
		const dayIndex = current.getDay();
		dayColumns.push({
			dateStr,
			dayName: dayNamesIndo[dayIndex],
			dayLabel: `${dayNamesIndo[dayIndex]}`
		});
		current.setDate(current.getDate() + 1);
	}

	// Fetch attendances for this project and date range
	const attendances = await sql`
		SELECT 
			a.*,
			k.nama as nama_karyawan,
			k.id as karyawan_id,
			j.nama_jabatan,
			k.rate_harian as base_rate_harian,
			k.rate_lembur_jam as base_rate_lembur_jam,
			k.rate_lembur_hari as base_rate_lembur_hari
		FROM absen_kehadiran a
		JOIN absen_karyawan k ON k.id = a.karyawan_id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		WHERE a.projek_id = ${selectedProjekId}
		  AND a.tanggal >= ${startDateStr}
		  AND a.tanggal <= ${endDateStr}
		ORDER BY k.id ASC, a.tanggal ASC;
	`;

	// Fetch all workers that worked in this period or are active in system
	const workersList = await sql`
		SELECT DISTINCT
			k.id, k.nama, j.nama_jabatan,
			k.rate_harian, k.rate_lembur_jam, k.rate_lembur_hari
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		WHERE k.id IN (
			SELECT karyawan_id FROM absen_kehadiran 
			WHERE projek_id = ${selectedProjekId} AND tanggal >= ${startDateStr} AND tanggal <= ${endDateStr}
		)
		OR k.status_aktif = true
		ORDER BY k.id ASC;
	`;

	// Build Matrix Map per worker:
	// workerId -> {
	//   harianByDate: { [dateStr]: number },
	//   lemburJamByDate: { [dateStr]: number },
	//   lemburHariByDate: { [dateStr]: number },
	//   rates: { harian, lemburJam, lemburHari }
	// }
	const matrixMap: Record<number, any> = {};
	const workerHarianRates: Record<number, Set<number>> = {};
	const workerLemburJamRates: Record<number, Set<number>> = {};
	const workerLemburHariRates: Record<number, Set<number>> = {};

	for (const w of workersList) {
		workerHarianRates[w.id] = new Set();
		workerLemburJamRates[w.id] = new Set();
		workerLemburHariRates[w.id] = new Set();

		matrixMap[w.id] = {
			worker: w,
			harianByDate: {},
			lemburJamByDate: {},
			lemburHariByDate: {},
			harianRateByDate: {},
			lemburJamRateByDate: {},
			lemburHariRateByDate: {},
			rateHarian: Number(w.rate_harian || 0),
			rateLemburJam: Number(w.rate_lembur_jam || 0),
			rateLemburHari: Number(w.rate_lembur_hari || 0),
			hasVariedRateHarian: false,
			totalHarian: 0,
			totalLemburJam: 0,
			totalLemburHari: 0,
			subtotalHarian: 0,
			subtotalLemburJam: 0,
			subtotalLemburHari: 0,
			totalGaji: 0
		};
	}

	for (const a of attendances) {
		const wEntry = matrixMap[a.karyawan_id];
		if (!wEntry) continue;

		const dStr = typeof a.tanggal === 'string' ? a.tanggal : a.tanggal.toISOString().split('T')[0];

		const h = Number(a.hadir_harian || 0);
		const lj = Number(a.lembur_jam || 0);
		const lh = Number(a.lembur_hari || 0);

		// Use snapshot rate if recorded, else employee base rate
		const rH = (a.snapshot_rate_harian !== null && a.snapshot_rate_harian !== undefined && a.snapshot_rate_harian !== '')
			? Number(a.snapshot_rate_harian)
			: Number(wEntry.rateHarian);
		const rLJ = (a.snapshot_rate_lembur_jam !== null && a.snapshot_rate_lembur_jam !== undefined && a.snapshot_rate_lembur_jam !== '')
			? Number(a.snapshot_rate_lembur_jam)
			: Number(wEntry.rateLemburJam);
		const rLH = (a.snapshot_rate_lembur_hari !== null && a.snapshot_rate_lembur_hari !== undefined && a.snapshot_rate_lembur_hari !== '')
			? Number(a.snapshot_rate_lembur_hari)
			: Number(wEntry.rateLemburHari);

		if (h > 0) {
			wEntry.harianByDate[dStr] = h;
			wEntry.harianRateByDate[dStr] = rH;
			workerHarianRates[a.karyawan_id]?.add(rH);
		}
		if (lj > 0) {
			wEntry.lemburJamByDate[dStr] = lj;
			wEntry.lemburJamRateByDate[dStr] = rLJ;
			workerLemburJamRates[a.karyawan_id]?.add(rLJ);
		}
		if (lh > 0) {
			wEntry.lemburHariByDate[dStr] = lh;
			wEntry.lemburHariRateByDate[dStr] = rLH;
			workerLemburHariRates[a.karyawan_id]?.add(rLH);
		}

		wEntry.totalHarian += h;
		wEntry.totalLemburJam += lj;
		wEntry.totalLemburHari += lh;

		// Hitung akumulasi subtotal riil per hari sesuai tarif hari tersebut
		wEntry.subtotalHarian += h * rH;
		wEntry.subtotalLemburJam += lj * rLJ;
		wEntry.subtotalLemburHari += lh * rLH;
	}

	// Calculate subtotals and total gaji per worker
	let grandTotalGaji = 0;
	const reportRows: any[] = [];

	for (const w of workersList) {
		const m = matrixMap[w.id];
		// Filter out workers that had 0 presence if they were only loaded as active
		if (m.totalHarian === 0 && m.totalLemburJam === 0 && m.totalLemburHari === 0 && attendances.length > 0) {
			// keep them or let them show if list is small; let's include active workers who have records
			const hasAnyRecord = attendances.some(att => att.karyawan_id === w.id);
			if (!hasAnyRecord && attendances.length > 0) continue;
		}

		// Tentukan tarif yang ditampilkan pada kolom GAJI (RATE)
		const hRates = workerHarianRates[w.id] || new Set();
		if (hRates.size === 1) {
			m.rateHarian = Array.from(hRates)[0];
		} else if (hRates.size > 1) {
			m.hasVariedRateHarian = true;
			// Prioritaskan rate master pekerja jika ada, jika tidak gunakan salah satu tarif yang tercatat
			m.rateHarian = Number(w.rate_harian) > 0 ? Number(w.rate_harian) : Array.from(hRates)[0];
		}

		const ljRates = workerLemburJamRates[w.id] || new Set();
		if (ljRates.size === 1) {
			m.rateLemburJam = Array.from(ljRates)[0];
		} else if (ljRates.size > 1) {
			m.rateLemburJam = Number(w.rate_lembur_jam) > 0 ? Number(w.rate_lembur_jam) : Array.from(ljRates)[0];
		}

		const lhRates = workerLemburHariRates[w.id] || new Set();
		if (lhRates.size === 1) {
			m.rateLemburHari = Array.from(lhRates)[0];
		} else if (lhRates.size > 1) {
			m.rateLemburHari = Number(w.rate_lembur_hari) > 0 ? Number(w.rate_lembur_hari) : Array.from(lhRates)[0];
		}

		// Total gaji pekerja adalah penjumlahan subtotal riil masing-masing komponen
		m.totalGaji = m.subtotalHarian + m.subtotalLemburJam + m.subtotalLemburHari;

		grandTotalGaji += m.totalGaji;
		reportRows.push(m);
	}

	return {
		projects,
		selectedProjek,
		selectedProjekId,
		mode,
		startDateStr,
		endDateStr,
		cutoffDateStr: endDateStr,
		runningCutoffStr: runningWeek.cutoffStr,
		currentMonthStr: getCurrentMonthStr(),
		dayColumns,
		reportRows,
		grandTotalGaji
	};
};
