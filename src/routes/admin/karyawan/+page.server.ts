import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	const employees = await sql`
		SELECT 
			k.*,
			j.nama_jabatan,
			u.username
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_users u ON u.id = k.user_id
		ORDER BY k.status_aktif DESC, k.nama ASC;
	`;

	const jabatans = await sql`
		SELECT j.*, COUNT(k.id) as total_karyawan
		FROM absen_jabatan j
		LEFT JOIN absen_karyawan k ON k.jabatan_id = j.id
		GROUP BY j.id
		ORDER BY j.nama_jabatan ASC;
	`;

	return {
		employees,
		jabatans
	};
};

export const actions: Actions = {
	tambahKaryawan: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const nama = String(data.get('nama') || '').trim();
		const jabatanId = Number(data.get('jabatan_id')) || null;
		const noHp = String(data.get('no_hp') || '').trim();
		const rateHarian = Number(data.get('rate_harian')) || 0;
		const rateLemburJam = Number(data.get('rate_lembur_jam')) || 0;
		const rateLemburHari = Number(data.get('rate_lembur_hari')) || rateHarian;

		const username = String(data.get('username') || '').trim().toLowerCase();
		const password = String(data.get('password') || '').trim();

		if (!nama) {
			return fail(400, { error: 'Nama karyawan wajib diisi' });
		}

		let userId = null;
		if (username && password) {
			const [existing] = await sql`SELECT id FROM absen_users WHERE username = ${username} LIMIT 1;`;
			if (existing) {
				return fail(400, { error: `Username '${username}' sudah digunakan akun lain` });
			}
			const pwdHash = await hashPassword(password);
			const [user] = await sql`
				INSERT INTO absen_users (username, password_hash, nama, role)
				VALUES (${username}, ${pwdHash}, ${nama}, 'KARYAWAN')
				RETURNING id;
			`;
			userId = user.id;
		}

		await sql`
			INSERT INTO absen_karyawan (
				user_id, jabatan_id, nama, no_hp, rate_harian, rate_lembur_jam, rate_lembur_hari, status_aktif
			)
			VALUES (
				${userId}, ${jabatanId}, ${nama}, ${noHp}, ${rateHarian}, ${rateLemburJam}, ${rateLemburHari}, true
			);
		`;

		return { success: true, message: `Karyawan ${nama} berhasil didaftarkan!` };
	},

	updateRate: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const rateHarian = Number(data.get('rate_harian')) || 0;
		const rateLemburJam = Number(data.get('rate_lembur_jam')) || 0;
		const rateLemburHari = Number(data.get('rate_lembur_hari')) || 0;
		const jabatanId = Number(data.get('jabatan_id')) || null;
		const noHp = String(data.get('no_hp') || '').trim();

		await sql`
			UPDATE absen_karyawan
			SET rate_harian = ${rateHarian},
				rate_lembur_jam = ${rateLemburJam},
				rate_lembur_hari = ${rateLemburHari},
				jabatan_id = ${jabatanId},
				no_hp = ${noHp},
				updated_at = NOW()
			WHERE id = ${id};
		`;

		return { success: true, message: 'Tarif rate gaji karyawan berhasil diperbarui!' };
	},

	tambahJabatan: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const namaJabatan = String(data.get('nama_jabatan') || '').trim();
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!namaJabatan) {
			return fail(400, { error: 'Nama jabatan wajib diisi' });
		}

		await sql`
			INSERT INTO absen_jabatan (nama_jabatan, keterangan)
			VALUES (${namaJabatan}, ${keterangan});
		`;

		return { success: true, message: `Jabatan '${namaJabatan}' berhasil ditambahkan!` };
	},

	toggleStatusKaryawan: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const current = data.get('status_aktif') === 'true';

		await sql`
			UPDATE absen_karyawan SET status_aktif = ${!current} WHERE id = ${id};
		`;

		return { success: true, message: 'Status keaktifan karyawan diperbarui' };
	}
};
