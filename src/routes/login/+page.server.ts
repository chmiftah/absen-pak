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

	// Fetch active projects for demo switcher
	const projects = await sql`
		SELECT id, nama_projek, lokasi
		FROM absen_projek
		WHERE status = 'AKTIF'
		ORDER BY id DESC;
	`;

	const [adminUser] = await sql`
		SELECT id, username, nama, role
		FROM absen_users
		WHERE role = 'ADMIN'
		LIMIT 1;
	`;

	// Fetch all workers directly from users and employees (bukan dari riwayat absen)
	const projectWorkers = await sql`
		SELECT 
			u.id as user_id,
			u.username,
			u.nama,
			u.role,
			j.nama_jabatan,
			COALESCE(k.rate_harian, 0) as rate_harian,
			COALESCE(k.projek_id, 0) as projek_id,
			COALESCE(p.nama_projek, 'Umum') as nama_projek
		FROM absen_users u
		LEFT JOIN absen_karyawan k ON k.user_id = u.id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE u.role = 'KARYAWAN'
		ORDER BY 
			(CASE WHEN LOWER(u.username) = 'wakidi' OR LOWER(u.nama) ILIKE '%wakidi%' THEN 0 ELSE 1 END),
			u.nama ASC;
	`;

	return {
		projects,
		adminUser: adminUser || { id: 1, username: 'admin', nama: 'Administrator Proyek', role: 'ADMIN' },
		projectWorkers
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
