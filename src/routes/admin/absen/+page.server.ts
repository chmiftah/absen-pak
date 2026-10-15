import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	const selectedProjek = url.searchParams.get('projek_id') ? Number(url.searchParams.get('projek_id')) : null;
	const selectedTanggal = url.searchParams.get('tanggal') || '';

	const projects = await sql`
		SELECT id, nama_projek, status FROM absen_projek ORDER BY status ASC, id DESC;
	`;

	const employees = await sql`
		SELECT k.id, k.nama, k.rate_harian, k.rate_lembur_jam, k.rate_lembur_hari, j.nama_jabatan
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		WHERE k.status_aktif = true
		ORDER BY k.nama ASC;
	`;

	// Attendance query with filters
	let attendances;
	if (selectedProjek && selectedTanggal) {
		attendances = await sql`
			SELECT a.*, k.nama as nama_karyawan, j.nama_jabatan, p.nama_projek
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
			JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.projek_id = ${selectedProjek} AND a.tanggal = ${selectedTanggal}
			ORDER BY a.tanggal DESC, k.nama ASC;
		`;
	} else if (selectedProjek) {
		attendances = await sql`
			SELECT a.*, k.nama as nama_karyawan, j.nama_jabatan, p.nama_projek
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
			JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.projek_id = ${selectedProjek}
			ORDER BY a.tanggal DESC, k.nama ASC
			LIMIT 100;
		`;
	} else if (selectedTanggal) {
		attendances = await sql`
			SELECT a.*, k.nama as nama_karyawan, j.nama_jabatan, p.nama_projek
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
			JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.tanggal = ${selectedTanggal}
			ORDER BY a.tanggal DESC, k.nama ASC;
		`;
	} else {
		attendances = await sql`
			SELECT a.*, k.nama as nama_karyawan, j.nama_jabatan, p.nama_projek
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
			JOIN absen_projek p ON p.id = a.projek_id
			ORDER BY a.tanggal DESC, k.nama ASC
			LIMIT 50;
		`;
	}

	return {
		projects,
		employees,
		attendances,
		selectedProjek,
		selectedTanggal
	};
};

export const actions: Actions = {
	inputManual: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const karyawanId = Number(data.get('karyawan_id'));
		const projekId = Number(data.get('projek_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const hadirHarian = data.get('hadir_harian') === 'on' ? 1 : 0;
		const lemburJam = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const lemburHari = data.get('lembur_hari') === 'on' ? 1 : 0;
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!karyawanId || !projekId || !tanggal) {
			return fail(400, { error: 'Karyawan, proyek, dan tanggal wajib diisi' });
		}

		// Fetch current employee rates for snapshot
		const [k] = await sql`SELECT rate_harian, rate_lembur_jam, rate_lembur_hari FROM absen_karyawan WHERE id = ${karyawanId};`;
		if (!k) return fail(400, { error: 'Karyawan tidak ditemukan' });

		await sql`
			INSERT INTO absen_kehadiran (
				karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari, keterangan,
				snapshot_rate_harian, snapshot_rate_lembur_jam, snapshot_rate_lembur_hari, updated_at
			)
			VALUES (
				${karyawanId}, ${projekId}, ${tanggal}, ${hadirHarian}, ${lemburJam}, ${lemburHari}, ${keterangan},
				${k.rate_harian}, ${k.rate_lembur_jam}, ${k.rate_lembur_hari}, NOW()
			)
			ON CONFLICT (karyawan_id, projek_id, tanggal) DO UPDATE SET
				hadir_harian = EXCLUDED.hadir_harian,
				lembur_jam = EXCLUDED.lembur_jam,
				lembur_hari = EXCLUDED.lembur_hari,
				keterangan = EXCLUDED.keterangan,
				updated_at = NOW();
		`;

		return { success: true, message: 'Absensi berhasil disimpan oleh Admin!' };
	},

	editAbsen: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const projekId = Number(data.get('projek_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const hadirHarian = data.get('hadir_harian') === 'on' ? 1 : 0;
		const lemburJam = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const lemburHari = data.get('lembur_hari') === 'on' ? 1 : 0;
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!id) return fail(400, { error: 'ID absensi tidak ditemukan' });
		if (!projekId || !tanggal) return fail(400, { error: 'Proyek dan tanggal wajib diisi' });

		await sql`
			UPDATE absen_kehadiran
			SET projek_id = ${projekId},
			    tanggal = ${tanggal},
			    hadir_harian = ${hadirHarian},
			    lembur_jam = ${lemburJam},
			    lembur_hari = ${lemburHari},
			    keterangan = ${keterangan},
			    updated_at = NOW()
			WHERE id = ${id};
		`;

		return { success: true, message: 'Data absensi berhasil diperbarui!' };
	},

	hapus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));

		await sql`DELETE FROM absen_kehadiran WHERE id = ${id};`;
		return { success: true, message: 'Catatan absensi berhasil dihapus' };
	}
};
