import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const [karyawan] = await sql`
		SELECT k.id, k.nama, j.nama_jabatan
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		WHERE k.user_id = ${locals.user.id}
		LIMIT 1;
	`;

	if (!karyawan) {
		if (locals.user.role === 'ADMIN') throw redirect(303, '/admin');
		throw error(404, 'Profil karyawan tidak ditemukan');
	}

	// Month filter (default: current month e.g. 2026-10)
	const currentMonth = new Date().toISOString().slice(0, 7);
	const month = url.searchParams.get('month') || currentMonth;

	const attendances = await sql`
		SELECT a.id, a.tanggal, a.hadir_harian, a.lembur_jam, a.lembur_hari, a.keterangan, p.nama_projek
		FROM absen_kehadiran a
		JOIN absen_projek p ON p.id = a.projek_id
		WHERE a.karyawan_id = ${karyawan.id}
		  AND TO_CHAR(a.tanggal, 'YYYY-MM') = ${month}
		ORDER BY a.tanggal DESC;
	`;

	// Compute attendance summaries (tanpa info uang/rate)
	let totalHarian = 0;
	let totalLemburJam = 0;
	let totalLemburHari = 0;

	for (const a of attendances) {
		totalHarian += Number(a.hadir_harian || 0);
		totalLemburJam += Number(a.lembur_jam || 0);
		totalLemburHari += Number(a.lembur_hari || 0);
	}

	return {
		karyawan,
		month,
		attendances,
		summary: {
			totalHarian,
			totalLemburJam,
			totalLemburHari
		}
	};
};
