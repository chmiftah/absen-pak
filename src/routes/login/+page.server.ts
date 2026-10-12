import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import { verifyPassword, createSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		if (locals.user.role === 'ADMIN') {
			throw redirect(303, '/admin');
		} else {
			throw redirect(303, '/absen');
		}
	}

	// Fetch quick test accounts for convenience
	const demoUsers = await sql`
		SELECT u.id, u.username, u.nama, u.role, j.nama_jabatan
		FROM absen_users u
		LEFT JOIN absen_karyawan k ON k.user_id = u.id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		ORDER BY u.role ASC, u.nama ASC
		LIMIT 8;
	`;

	return {
		demoUsers
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') || '').trim();
		const password = String(data.get('password') || '').trim();

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi' });
		}

		const [user] = await sql`
			SELECT id, username, password_hash, nama, role
			FROM absen_users
			WHERE username = ${username}
			LIMIT 1;
		`;

		if (!user) {
			return fail(400, { error: 'Username atau password salah' });
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return fail(400, { error: 'Username atau password salah' });
		}

		createSessionCookie(cookies, { id: user.id, role: user.role });

		if (user.role === 'ADMIN') {
			throw redirect(303, '/admin');
		} else {
			throw redirect(303, '/absen');
		}
	}
};
