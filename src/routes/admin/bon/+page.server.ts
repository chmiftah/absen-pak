import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import {
	formatLocalDate,
	formatIndoDate,
	getRunningWeekRange,
	getCurrentMonthStr,
	getMonthRange
} from '$lib/dateUtils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	// Filter parameters
	const projekIdParam = url.searchParams.get('projek_id');
	const selectedProjekId = projekIdParam && projekIdParam !== 'all' ? Number(projekIdParam) : null;

	const karyawanIdParam = url.searchParams.get('karyawan_id');
	const selectedKaryawanId = karyawanIdParam && karyawanIdParam !== 'all' ? Number(karyawanIdParam) : null;

	const rawPeriode = url.searchParams.get('periode') || 'semua';
	const customStart = url.searchParams.get('start_date') || '';
	const customEnd = url.searchParams.get('end_date') || '';
	const searchQuery = (url.searchParams.get('q') || '').trim();

	// Fetch active projects for dropdown
	const projects = await sql`
		SELECT id, nama_projek, lokasi, status 
		FROM absen_projek 
		ORDER BY status ASC, id DESC;
	`;

	// Fetch active employees with job title and assigned project
	const employees = await sql`
		SELECT k.id, k.nama, k.rate_harian, k.projek_id,
		       j.nama_jabatan, p.nama_projek
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE k.status_aktif = true
		ORDER BY k.nama ASC;
	`;

	// Determine Date Range
	let startDateStr = '';
	let endDateStr = '';
	let periodeLabel = 'Semua Riwayat';

	if (rawPeriode === 'hari_ini') {
		const today = formatLocalDate();
		startDateStr = today;
		endDateStr = today;
		periodeLabel = `Hari Ini (${formatIndoDate(today)})`;
	} else if (rawPeriode === 'minggu_ini') {
		const rw = getRunningWeekRange();
		startDateStr = rw.startStr;
		endDateStr = rw.endStr;
		periodeLabel = `Minggu Ini (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (rawPeriode === 'bulan_ini') {
		const curMonth = getCurrentMonthStr();
		const mr = getMonthRange(curMonth);
		startDateStr = mr.startStr;
		endDateStr = mr.endStr;
		periodeLabel = `Bulan Ini (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (rawPeriode === 'custom' && (customStart || customEnd)) {
		startDateStr = customStart;
		endDateStr = customEnd;
		periodeLabel = `Rentang (${formatIndoDate(startDateStr)} s/d ${formatIndoDate(endDateStr)})`;
	}

	// SQL conditions
	const projCond = selectedProjekId ? sql`AND b.projek_id = ${selectedProjekId}` : sql``;
	const userCond = selectedKaryawanId ? sql`AND b.karyawan_id = ${selectedKaryawanId}` : sql``;
	const dateCond = (startDateStr && endDateStr) 
		? sql`AND b.tanggal >= ${startDateStr} AND b.tanggal <= ${endDateStr}` 
		: (startDateStr ? sql`AND b.tanggal >= ${startDateStr}` : (endDateStr ? sql`AND b.tanggal <= ${endDateStr}` : sql``));
	const searchCond = searchQuery 
		? sql`AND (k.nama ILIKE ${'%' + searchQuery + '%'} OR b.keterangan ILIKE ${'%' + searchQuery + '%'} OR p.nama_projek ILIKE ${'%' + searchQuery + '%'})` 
		: sql``;

	// Fetch Bon records
	const bonList = await sql`
		SELECT 
			b.id,
			b.projek_id,
			b.karyawan_id,
			b.tanggal,
			b.jam,
			b.nominal,
			b.keterangan,
			b.created_at,
			k.nama as nama_karyawan,
			j.nama_jabatan,
			p.nama_projek,
			p.lokasi as lokasi_projek,
			u.nama as recorded_by_name
		FROM absen_bon b
		JOIN absen_karyawan k ON k.id = b.karyawan_id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		JOIN absen_projek p ON p.id = b.projek_id
		LEFT JOIN absen_users u ON u.id = b.created_by
		WHERE 1=1
		  ${projCond}
		  ${userCond}
		  ${dateCond}
		  ${searchCond}
		ORDER BY b.tanggal DESC, b.jam DESC, b.id DESC;
	`;

	// Compute Total Bon per User (overall or for filtered project)
	const userBonTotals = await sql`
		SELECT 
			b.karyawan_id,
			k.nama as nama_karyawan,
			j.nama_jabatan,
			k.projek_id as default_projek_id,
			p.nama_projek as default_projek_nama,
			COUNT(b.id)::int as jumlah_transaksi,
			SUM(b.nominal)::numeric as total_bon,
			MAX(b.tanggal) as tanggal_terakhir
		FROM absen_bon b
		JOIN absen_karyawan k ON k.id = b.karyawan_id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE 1=1
		  ${projCond}
		GROUP BY b.karyawan_id, k.nama, j.nama_jabatan, k.projek_id, p.nama_projek
		ORDER BY total_bon DESC, k.nama ASC;
	`;

	// Map of total bon for quick lookup in form and badges
	const totalBonMap: Record<number, number> = {};
	for (const ub of userBonTotals) {
		totalBonMap[ub.karyawan_id] = Number(ub.total_bon || 0);
	}

	// Calculate grand total in current view
	const totalNominalView = bonList.reduce((acc, row) => acc + Number(row.nominal || 0), 0);

	// Also calculate total all-time bon across system
	const [overallStat] = await sql`
		SELECT 
			COUNT(id)::int as total_transaksi,
			COALESCE(SUM(nominal), 0)::numeric as total_nominal,
			COUNT(DISTINCT karyawan_id)::int as total_karyawan
		FROM absen_bon;
	`;

	return {
		projects,
		employees,
		bonList,
		userBonTotals,
		totalBonMap,
		totalNominalView,
		overallStat: {
			totalTransaksi: Number(overallStat?.total_transaksi || 0),
			totalNominal: Number(overallStat?.total_nominal || 0),
			totalKaryawan: Number(overallStat?.total_karyawan || 0)
		},
		filters: {
			projekId: selectedProjekId,
			karyawanId: selectedKaryawanId,
			periode: rawPeriode,
			startDateStr,
			endDateStr,
			periodeLabel,
			q: searchQuery
		},
		todayStr: formatLocalDate()
	};
};

export const actions: Actions = {
	tambahBon: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const projekId = Number(data.get('projek_id'));
		const karyawanId = Number(data.get('karyawan_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		let jam = String(data.get('jam') || '').trim();
		const rawNominal = data.get('nominal');
		const keterangan = String(data.get('keterangan') || '').trim();

		const nominal = Number(String(rawNominal || '').replace(/[^0-9]/g, '')) || 0;

		if (!projekId) return fail(400, { error: 'Silakan pilih proyek' });
		if (!karyawanId) return fail(400, { error: 'Silakan pilih karyawan' });
		if (!tanggal) return fail(400, { error: 'Tanggal wajib diisi' });

		if (!jam) {
			const now = new Date();
			jam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		}

		// Verify employee exists
		const [k] = await sql`
			SELECT id, nama FROM absen_karyawan WHERE id = ${karyawanId};
		`;
		if (!k) return fail(400, { error: 'Karyawan tidak ditemukan' });

		await sql`
			INSERT INTO absen_bon (projek_id, karyawan_id, tanggal, jam, nominal, keterangan, created_by)
			VALUES (${projekId}, ${karyawanId}, ${tanggal}, ${jam}, ${nominal}, ${keterangan}, ${locals.user.id});
		`;

		// Fetch updated total bon for this user
		const [tot] = await sql`
			SELECT SUM(nominal)::numeric as total
			FROM absen_bon
			WHERE karyawan_id = ${karyawanId};
		`;

		const totalBonUser = Number(tot?.total || 0);

		return {
			success: true,
			message: `Bon Rp ${new Intl.NumberFormat('id-ID').format(nominal)} untuk ${k.nama} berhasil dicatat! Total bon ${k.nama} saat ini: Rp ${new Intl.NumberFormat('id-ID').format(totalBonUser)}`
		};
	},

	editBon: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const projekId = Number(data.get('projek_id'));
		const karyawanId = Number(data.get('karyawan_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const jam = String(data.get('jam') || '').trim();
		const rawNominal = data.get('nominal');
		const keterangan = String(data.get('keterangan') || '').trim();

		const nominal = Number(String(rawNominal || '').replace(/[^0-9]/g, '')) || 0;

		if (!id) return fail(400, { error: 'ID bon tidak valid' });
		if (!projekId || !karyawanId || !tanggal) {
			return fail(400, { error: 'Proyek, karyawan, dan tanggal wajib diisi' });
		}

		await sql`
			UPDATE absen_bon
			SET projek_id = ${projekId},
			    karyawan_id = ${karyawanId},
			    tanggal = ${tanggal},
			    jam = ${jam || '12:00'},
			    nominal = ${nominal},
			    keterangan = ${keterangan},
			    updated_at = NOW()
			WHERE id = ${id};
		`;

		return { success: true, message: 'Data bon berhasil diperbarui!' };
	},

	hapusBon: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));

		if (!id) return fail(400, { error: 'ID bon tidak valid' });

		await sql`DELETE FROM absen_bon WHERE id = ${id};`;

		return { success: true, message: 'Catatan bon berhasil dihapus!' };
	}
};
