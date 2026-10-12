import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import { hashPassword, createSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, locals.user.role === 'ADMIN' ? '/admin' : '/absen');
	}

	const jabatans = await sql`
		SELECT id, nama_jabatan FROM absen_jabatan ORDER BY nama_jabatan ASC;
	`;

	return {
		jabatans
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const nama = String(data.get('nama') || '').trim();
		const username = String(data.get('username') || '').trim().toLowerCase();
		const password = String(data.get('password') || '').trim();
		const jabatanId = Number(data.get('jabatan_id')) || null;
		const noHp = String(data.get('no_hp') || '').trim();

		// Default initial rates
		const rateHarian = Number(data.get('rate_harian')) || 90000;
		const rateLemburJam = Number(data.get('rate_lembur_jam')) || 15000;
		const rateLemburHari = Number(data.get('rate_lembur_hari')) || rateHarian;

		if (!nama || !username || !password) {
			return fail(400, { error: 'Nama, username, dan password wajib diisi' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Username minimal 3 karakter' });
		}

		// Check if username exists
		const [existing] = await sql`
			SELECT id FROM absen_users WHERE username = ${username} LIMIT 1;
		`;
		if (existing) {
			return fail(400, { error: 'Username sudah digunakan, silakan pilih username lain' });
		}

		const pwdHash = await hashPassword(password);

		// Transaction to insert user and employee
		const [newUser] = await sql`
			INSERT INTO absen_users (username, password_hash, nama, role)
			VALUES (${username}, ${pwdHash}, ${nama}, 'KARYAWAN')
			RETURNING id, role;
		`;

		await sql`
			INSERT INTO absen_karyawan (
				user_id, jabatan_id, nama, no_hp, rate_harian, rate_lembur_jam, rate_lembur_hari, status_aktif
			)
			VALUES (
				${newUser.id}, ${jabatanId}, ${nama}, ${noHp}, ${rateHarian}, ${rateLemburJam}, ${rateLemburHari}, true
			);
		`;

		createSessionCookie(cookies, { id: newUser.id, role: newUser.role });

		throw redirect(303, '/absen');
	}
};
