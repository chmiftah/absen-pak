import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

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

	if (mode === 'mingguan') {
		// Default to 2026-10-10 (matching the sample photo sheet) or query param
		const cutoffParam = url.searchParams.get('cutoff') || '2026-10-10';
		const end = new Date(cutoffParam);
		// 6 days before end date -> 7 days total (Minggu s/d Sabtu)
		const start = new Date(end);
		start.setDate(end.getDate() - 6);

		startDateStr = start.toISOString().split('T')[0];
		endDateStr = end.toISOString().split('T')[0];
	} else if (mode === 'bulanan') {
		const monthParam = url.searchParams.get('bulan') || '2026-10';
		const [year, m] = monthParam.split('-').map(Number);
		const lastDay = new Date(year, m, 0).getDate();
		startDateStr = `${monthParam}-01`;
		endDateStr = `${monthParam}-${String(lastDay).padStart(2, '0')}`;
	} else {
		// Custom date range
		startDateStr = url.searchParams.get('start_date') || '2026-10-04';
		endDateStr = url.searchParams.get('end_date') || '2026-10-10';
	}

	// Generate array of day columns in the range
	const dayColumns: { dateStr: string; dayName: string; dayLabel: string }[] = [];
	const startObj = new Date(startDateStr);
	const endObj = new Date(endDateStr);

	const dayNamesIndo = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

	const current = new Date(startObj);
	while (current <= endObj) {
		const dateStr = current.toISOString().split('T')[0];
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

	for (const w of workersList) {
		matrixMap[w.id] = {
			worker: w,
			harianByDate: {},
			lemburJamByDate: {},
			lemburHariByDate: {},
			rateHarian: Number(w.rate_harian),
			rateLemburJam: Number(w.rate_lembur_jam),
			rateLemburHari: Number(w.rate_lembur_hari),
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
		const rH = Number(a.snapshot_rate_harian || wEntry.rateHarian);
		const rLJ = Number(a.snapshot_rate_lembur_jam || wEntry.rateLemburJam);
		const rLH = Number(a.snapshot_rate_lembur_hari || wEntry.rateLemburHari);

		wEntry.rateHarian = rH;
		wEntry.rateLemburJam = rLJ;
		wEntry.rateLemburHari = rLH;

		if (h > 0) wEntry.harianByDate[dStr] = h;
		if (lj > 0) wEntry.lemburJamByDate[dStr] = lj;
		if (lh > 0) wEntry.lemburHariByDate[dStr] = lh;

		wEntry.totalHarian += h;
		wEntry.totalLemburJam += lj;
		wEntry.totalLemburHari += lh;
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

		m.subtotalHarian = m.totalHarian * m.rateHarian;
		m.subtotalLemburJam = m.totalLemburJam * m.rateLemburJam;
		m.subtotalLemburHari = m.totalLemburHari * m.rateLemburHari;
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
		dayColumns,
		reportRows,
		grandTotalGaji
	};
};
