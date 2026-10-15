import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Fetch employee profile (tanpa memaparkan rate ke worker)
	const [karyawan] = await sql`
		SELECT k.id, k.user_id, k.nama, k.no_hp, k.status_aktif, j.nama_jabatan
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		WHERE k.user_id = ${locals.user.id}
		LIMIT 1;
	`;

	if (!karyawan) {
		if (locals.user.role === 'ADMIN') {
			throw redirect(303, '/admin');
		}
		throw error(404, 'Data karyawan untuk akun Anda tidak ditemukan. Hubungi admin.');
	}

	// Fetch active projects
	const activeProjects = await sql`
		SELECT id, nama_projek, lokasi
		FROM absen_projek
		WHERE status = 'AKTIF'
		ORDER BY id DESC;
	`;

	const selectedDate = url.searchParams.get('tanggal') || new Date().toISOString().split('T')[0];

	// Check if already submitted on this date for ANY project
	const [anyTodayAtt] = await sql`
		SELECT a.id, a.karyawan_id, a.projek_id, a.tanggal, a.hadir_harian, a.lembur_jam, a.lembur_hari, a.keterangan, p.nama_projek
		FROM absen_kehadiran a
		JOIN absen_projek p ON p.id = a.projek_id
		WHERE a.karyawan_id = ${karyawan.id}
		  AND a.tanggal = ${selectedDate}
		LIMIT 1;
	`;

	let currentProjekId = url.searchParams.get('projek_id') ? Number(url.searchParams.get('projek_id')) : null;
	if (!currentProjekId && anyTodayAtt) {
		currentProjekId = anyTodayAtt.projek_id;
	} else if (!currentProjekId) {
		currentProjekId = activeProjects[0]?.id || null;
	}

	let existingAttendance = null;
	if (currentProjekId) {
		const [att] = await sql`
			SELECT id, karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari, keterangan
			FROM absen_kehadiran
			WHERE karyawan_id = ${karyawan.id}
			  AND projek_id = ${currentProjekId}
			  AND tanggal = ${selectedDate}
			LIMIT 1;
		`;
		existingAttendance = att || null;
	}

	// Recent 7 days attendance history
	const recentAttendances = await sql`
		SELECT a.id, a.karyawan_id, a.projek_id, a.tanggal, a.hadir_harian, a.lembur_jam, a.lembur_hari, a.keterangan, p.nama_projek
		FROM absen_kehadiran a
		JOIN absen_projek p ON p.id = a.projek_id
		WHERE a.karyawan_id = ${karyawan.id}
		ORDER BY a.tanggal DESC
		LIMIT 7;
	`;

	return {
		karyawan,
		activeProjects,
		selectedDate,
		selectedProjekId: currentProjekId,
		existingAttendance,
		recentAttendances
	};
};

export const actions: Actions = {
	simpan: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const [karyawan] = await sql`
			SELECT * FROM absen_karyawan WHERE user_id = ${locals.user.id} LIMIT 1;
		`;
		if (!karyawan) {
			return fail(400, { error: 'Profil karyawan tidak ditemukan' });
		}

		const data = await request.formData();
		const projekId = Number(data.get('projek_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const tipePresensi = String(data.get('tipe_presensi') || 'HARIAN').trim();
		const lemburJamInput = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!projekId || !tanggal) {
			return fail(400, { error: 'Proyek dan tanggal wajib dipilih' });
		}

		// Check existing attendance on this specific date
		const [existing] = await sql`
			SELECT * FROM absen_kehadiran
			WHERE karyawan_id = ${karyawan.id}
			  AND tanggal = ${tanggal}
			ORDER BY (CASE WHEN projek_id = ${projekId} THEN 0 ELSE 1 END)
			LIMIT 1;
		`;

		// 1. If already full day + full overtime day: completely locked
		if (existing && Number(existing.hadir_harian) >= 1 && Number(existing.lembur_hari) >= 1) {
			return fail(400, { error: 'Absensi hari penuh dan lembur penuh sudah tercatat untuk tanggal ini. Tidak dapat absen lagi.' });
		}

		let hadirHarian = 0;
		let lemburJam = 0;
		let lemburHari = 0;

		const sudahPernahAbsen = Boolean(
			existing && (
				Number(existing.hadir_harian) > 0 ||
				Number(existing.lembur_hari) > 0 ||
				Number(existing.lembur_jam) > 0
			)
		);

		// 2. If ALREADY CLOCKED IN TODAY:
		// Absen harian dan lembur harian TIDAK BISA DIPILIH!
		// HANYA LEMBUR JAM yang diperbolehkan!
		if (sudahPernahAbsen) {
			if (tipePresensi === 'HARIAN' || tipePresensi === 'LEMBUR_HARI') {
				return fail(400, { 
					error: 'Hari ini Anda sudah pernah absen. Pilihan Hadir Harian dan Lembur Harian sudah terkunci, Anda hanya dapat memilih Lembur Jam.' 
				});
			}

			hadirHarian = Number(existing.hadir_harian || 0);
			lemburHari = Number(existing.lembur_hari || 0);
			lemburJam = lemburJamInput;
		} else {
			// Belum pernah absen di tanggal ini: bebas memilih salah satu dari 3 tipe presensi
			if (tipePresensi === 'HARIAN') {
				hadirHarian = 1;
				lemburJam = 0;
				lemburHari = 0;
			} else if (tipePresensi === 'LEMBUR_JAM') {
				hadirHarian = 0;
				lemburJam = lemburJamInput > 0 ? lemburJamInput : 1;
				lemburHari = 0;
			} else if (tipePresensi === 'LEMBUR_HARI') {
				hadirHarian = 0;
				lemburJam = 0;
				lemburHari = 1;
			} else {
				return fail(400, { error: 'Pilih salah satu tipe presensi yang valid' });
			}
		}

		// Snapshot employee rates
		const snapHarian = existing?.snapshot_rate_harian || karyawan.rate_harian;
		const snapLemburJam = existing?.snapshot_rate_lembur_jam || karyawan.rate_lembur_jam;
		const snapLemburHari = existing?.snapshot_rate_lembur_hari || karyawan.rate_lembur_hari;
		const targetProjekId = existing ? existing.projek_id : projekId;

		await sql`
			INSERT INTO absen_kehadiran (
				karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari, keterangan,
				snapshot_rate_harian, snapshot_rate_lembur_jam, snapshot_rate_lembur_hari, updated_at
			)
			VALUES (
				${karyawan.id}, ${targetProjekId}, ${tanggal}, ${hadirHarian}, ${lemburJam}, ${lemburHari}, ${keterangan},
				${snapHarian}, ${snapLemburJam}, ${snapLemburHari}, NOW()
			)
			ON CONFLICT (karyawan_id, projek_id, tanggal) DO UPDATE SET
				hadir_harian = EXCLUDED.hadir_harian,
				lembur_jam = EXCLUDED.lembur_jam,
				lembur_hari = EXCLUDED.lembur_hari,
				keterangan = COALESCE(NULLIF(EXCLUDED.keterangan, ''), absen_kehadiran.keterangan),
				updated_at = NOW();
		`;

		return { success: true, message: 'Absensi mandiri berhasil disimpan!' };
	}
};
