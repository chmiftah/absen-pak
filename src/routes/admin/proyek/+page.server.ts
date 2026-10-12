import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	const projects = await sql`
		SELECT 
			p.*,
			COUNT(DISTINCT a.karyawan_id) as total_pekerja,
			COUNT(a.id) as total_absensi
		FROM absen_projek p
		LEFT JOIN absen_kehadiran a ON a.projek_id = p.id
		GROUP BY p.id
		ORDER BY p.id DESC;
	`;

	return {
		projects
	};
};

export const actions: Actions = {
	tambah: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const namaProjek = String(data.get('nama_projek') || '').trim();
		const lokasi = String(data.get('lokasi') || '').trim();

		if (!namaProjek) {
			return fail(400, { error: 'Nama proyek wajib diisi' });
		}

		await sql`
			INSERT INTO absen_projek (nama_projek, lokasi, status)
			VALUES (${namaProjek}, ${lokasi}, 'AKTIF');
		`;

		return { success: true, message: `Proyek '${namaProjek}' berhasil ditambahkan!` };
	},

	toggleStatus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const currentStatus = String(data.get('status'));
		const nextStatus = currentStatus === 'AKTIF' ? 'SELESAI' : 'AKTIF';

		await sql`
			UPDATE absen_projek SET status = ${nextStatus} WHERE id = ${id};
		`;

		return { success: true, message: 'Status proyek diperbarui' };
	},

	hapus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));

		try {
			await sql`DELETE FROM absen_projek WHERE id = ${id};`;
			return { success: true, message: 'Proyek berhasil dihapus' };
		} catch (err) {
			return fail(400, { error: 'Proyek tidak dapat dihapus karena sudah memiliki data absensi.' });
		}
	}
};
