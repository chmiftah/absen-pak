import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Fetch employee profile (tanpa memaparkan rate ke worker)
	const [karyawan] = await sql`
		SELECT k.id, k.user_id, k.nama, k.no_hp, k.status_aktif, k.projek_id, 
		       j.nama_jabatan, p.nama_projek, p.lokasi as lokasi_projek
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE k.user_id = ${locals.user.id}
		LIMIT 1;
	`;

	if (!karyawan) {
		if (locals.user.role === 'ADMIN') {
			throw redirect(303, '/admin');
		}
		throw error(404, 'Data karyawan untuk akun Anda tidak ditemukan. Hubungi admin.');
	}

	// Pekerja hanya dapat absen di proyek lokasi yang terdaftar di datamaster
	let activeProjects: any[] = [];
	if (karyawan.projek_id) {
		activeProjects = await sql`
			SELECT id, nama_projek, lokasi
			FROM absen_projek
			WHERE id = ${karyawan.projek_id}
			LIMIT 1;
		`;
	}

	const selectedDate = url.searchParams.get('tanggal') || new Date().toISOString().split('T')[0];

	// Proyek dikunci sesuai master data penugasan karyawan
	const currentProjekId = karyawan.projek_id ? Number(karyawan.projek_id) : null;

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
			SELECT k.*, p.nama_projek, p.lokasi as lokasi_projek 
			FROM absen_karyawan k 
			LEFT JOIN absen_projek p ON p.id = k.projek_id 
			WHERE k.user_id = ${locals.user.id} 
			LIMIT 1;
		`;
		if (!karyawan) {
			return fail(400, { error: 'Profil karyawan tidak ditemukan' });
		}

		if (!karyawan.projek_id) {
			return fail(400, { 
				error: 'Anda belum ditugaskan ke proyek manapun di data master karyawan. Hubungi admin untuk mengatur lokasi proyek Anda.' 
			});
		}

		const data = await request.formData();
		const submittedProjekId = Number(data.get('projek_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const tipePresensi = String(data.get('tipe_presensi') || 'HARIAN').trim();
		const lemburJamInput = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!tanggal) {
			return fail(400, { error: 'Tanggal wajib diisi' });
		}

		// Validasi ketat: Lokasi proyek harus sesuai datamaster
		if (submittedProjekId && submittedProjekId !== Number(karyawan.projek_id)) {
			return fail(400, {
				error: `Sesuai data master, Anda terdaftar di proyek "${karyawan.nama_projek || 'Proyek Anda'}". Anda tidak dapat absen di proyek lain!`
			});
		}

		const projekId = Number(karyawan.projek_id);

		// Cek jika ada catatan presensi di tanggal ini untuk proyek lain
		const [existingOther] = await sql`
			SELECT a.id, p.nama_projek 
			FROM absen_kehadiran a
			JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.karyawan_id = ${karyawan.id}
			  AND a.tanggal = ${tanggal}
			  AND a.projek_id != ${projekId}
			LIMIT 1;
		`;
		if (existingOther) {
			return fail(400, {
				error: `Presensi tanggal ${tanggal} sudah tercatat di proyek "${existingOther.nama_projek}". Sesuai data master, lokasi Anda adalah "${karyawan.nama_projek}".`
			});
		}

		// Check existing attendance on this specific project & date
		const [existing] = await sql`
			SELECT * FROM absen_kehadiran
			WHERE karyawan_id = ${karyawan.id}
			  AND projek_id = ${projekId}
			  AND tanggal = ${tanggal}
			LIMIT 1;
		`;

		// 1. If already full day + full overtime day: completely locked
		if (existing && Number(existing.hadir_harian) >= 1 && Number(existing.lembur_hari) >= 1) {
			return fail(400, { error: 'Absensi hari penuh dan lembur penuh sudah tercatat untuk tanggal ini. Tidak dapat absen lagi.' });
		}

		let hadirHarian = Number(existing?.hadir_harian || 0);
		let lemburJam = Number(existing?.lembur_jam || 0);
		let lemburHari = Number(existing?.lembur_hari || 0);
		const sudahPernahAbsen = Boolean(
			existing && (
				Number(existing.hadir_harian) > 0 ||
				Number(existing.lembur_hari) > 0 ||
				Number(existing.lembur_jam) > 0
			)
		);

		if (sudahPernahAbsen) {
			// Jika sudah pernah absen di tanggal ini:
			// Pekerja tetap diperbolehkan menambah Lembur Jam atau Lembur 1 Hari Penuh!
			if (tipePresensi === 'LEMBUR_HARI') {
				lemburHari = 1;
			} else if (tipePresensi === 'LEMBUR_JAM') {
				lemburJam = lemburJamInput;
			} else if (tipePresensi === 'HARIAN') {
				hadirHarian = 1;
			} else {
				return fail(400, { error: 'Pilih tipe presensi yang valid' });
			}
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

		await sql`
			INSERT INTO absen_kehadiran (
				karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari, keterangan,
				snapshot_rate_harian, snapshot_rate_lembur_jam, snapshot_rate_lembur_hari, updated_at
			)
			VALUES (
				${karyawan.id}, ${projekId}, ${tanggal}, ${hadirHarian}, ${lemburJam}, ${lemburHari}, ${keterangan},
				${snapHarian}, ${snapLemburJam}, ${snapLemburHari}, NOW()
			)
			ON CONFLICT (karyawan_id, projek_id, tanggal) DO UPDATE SET
				hadir_harian = EXCLUDED.hadir_harian,
				lembur_jam = EXCLUDED.lembur_jam,
				lembur_hari = EXCLUDED.lembur_hari,
				keterangan = COALESCE(NULLIF(EXCLUDED.keterangan, ''), absen_kehadiran.keterangan),
				updated_at = NOW();
		`;

		return { success: true, message: `Absensi mandiri di proyek ${karyawan.nama_projek} berhasil disimpan!` };
	}
};
