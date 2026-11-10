import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import { hashPassword, verifyPassword } from '$lib/server/auth';
import { formatLocalDate, getCurrentMonthStr, getMonthRange, formatIndoDate } from '$lib/dateUtils';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const [userProfile] = await sql`
		SELECT 
			u.id, u.username, u.nama, u.role, u.created_at,
			k.id as karyawan_id, k.jabatan_id, k.projek_id, k.no_hp,
			k.rate_harian, k.rate_lembur_jam, k.rate_lembur_hari, k.status_aktif,
			j.nama_jabatan,
			p.nama_projek, p.lokasi as lokasi_projek
		FROM absen_users u
		LEFT JOIN absen_karyawan k ON k.user_id = u.id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE u.id = ${locals.user.id}
		LIMIT 1;
	`;

	if (!userProfile) {
		throw redirect(303, '/login');
	}

	const todayStr = formatLocalDate();
	const curMonth = getCurrentMonthStr();
	const mRange = getMonthRange(curMonth);

	let adminStats = null;
	let workerStats = null;
	let recentActivities: any[] = [];
	let todayCheckin = null;

	if (userProfile.role === 'ADMIN') {
		const [projCount] = await sql`SELECT COUNT(*)::int as count FROM absen_projek WHERE status = 'AKTIF';`;
		const [empCount] = await sql`SELECT COUNT(*)::int as count FROM absen_karyawan WHERE status_aktif = true;`;
		const [todayCount] = await sql`SELECT COUNT(*)::int as count FROM absen_kehadiran WHERE tanggal = ${todayStr};`;
		const [monthCount] = await sql`
			SELECT COUNT(*)::int as count FROM absen_kehadiran 
			WHERE tanggal >= ${mRange.startStr} AND tanggal <= ${mRange.endStr};
		`;

		adminStats = {
			totalProjects: projCount?.count || 0,
			totalEmployees: empCount?.count || 0,
			todayAttendances: todayCount?.count || 0,
			monthAttendances: monthCount?.count || 0
		};

		recentActivities = await sql`
			SELECT a.id, a.tanggal, a.hadir_harian, a.lembur_jam, a.lembur_hari,
			       k.nama as nama_karyawan, p.nama_projek, j.nama_jabatan
			FROM absen_kehadiran a
			LEFT JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_projek p ON p.id = a.projek_id
			LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
			ORDER BY a.tanggal DESC, a.id DESC
			LIMIT 8;
		`;
	} else if (userProfile.karyawan_id) {
		// Worker stats for the current month
		const monthAttendances = await sql`
			SELECT a.*, p.nama_projek
			FROM absen_kehadiran a
			LEFT JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.karyawan_id = ${userProfile.karyawan_id}
			  AND a.tanggal >= ${mRange.startStr}
			  AND a.tanggal <= ${mRange.endStr}
			ORDER BY a.tanggal DESC;
		`;

		let totalHadir = 0;
		let totalLemburJam = 0;
		let totalLemburHari = 0;
		let totalUpahEstimasi = 0;

		const rateHarian = Number(userProfile.rate_harian || 0);
		const rateJam = Number(userProfile.rate_lembur_jam || 0);
		const rateHari = Number(userProfile.rate_lembur_hari || 0);

		for (const a of monthAttendances) {
			const hadir = Number(a.hadir_harian || 0);
			const lJam = Number(a.lembur_jam || 0);
			const lHari = Number(a.lembur_hari || 0);

			totalHadir += hadir;
			totalLemburJam += lJam;
			totalLemburHari += lHari;

			const upahHadir = hadir * (Number(a.snapshot_rate_harian) || rateHarian);
			const upahLemburJam = lJam * (Number(a.snapshot_rate_lembur_jam) || rateJam);
			const upahLemburHari = lHari * (Number(a.snapshot_rate_lembur_hari) || rateHari);
			totalUpahEstimasi += upahHadir + upahLemburJam + upahLemburHari;
		}

		workerStats = {
			totalHadir,
			totalLemburJam,
			totalLemburHari,
			totalUpahEstimasi,
			monthName: formatIndoDate(mRange.startStr).split(' ')[1] || 'Bulan Ini'
		};

		recentActivities = monthAttendances.slice(0, 8);

		const [checkedIn] = await sql`
			SELECT a.*, p.nama_projek
			FROM absen_kehadiran a
			LEFT JOIN absen_projek p ON p.id = a.projek_id
			WHERE a.karyawan_id = ${userProfile.karyawan_id}
			  AND a.tanggal = ${todayStr}
			LIMIT 1;
		`;
		todayCheckin = checkedIn || null;
	}

	return {
		userProfile,
		adminStats,
		workerStats,
		recentActivities,
		todayCheckin,
		todayStr
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const nama = String(data.get('nama') || '').trim();
		const username = String(data.get('username') || '').trim().toLowerCase();
		const noHp = String(data.get('no_hp') || '').trim();

		if (!nama || nama.length < 2) {
			return fail(400, { error: 'Nama lengkap minimal 2 karakter' });
		}
		if (!username || username.length < 3) {
			return fail(400, { error: 'Username minimal 3 karakter' });
		}
		if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
			return fail(400, { error: 'Username hanya boleh huruf, angka, titik, atau strip (-_.)' });
		}

		// Check if username taken by another account
		const [existing] = await sql`
			SELECT id FROM absen_users 
			WHERE username = ${username} AND id != ${locals.user.id} 
			LIMIT 1;
		`;
		if (existing) {
			return fail(400, { error: `Username '${username}' sudah digunakan oleh pengguna lain` });
		}

		// Update absen_users
		await sql`
			UPDATE absen_users 
			SET nama = ${nama}, username = ${username} 
			WHERE id = ${locals.user.id};
		`;

		// Update absen_karyawan if linked
		await sql`
			UPDATE absen_karyawan 
			SET nama = ${nama}, no_hp = ${noHp}, updated_at = NOW() 
			WHERE user_id = ${locals.user.id};
		`;

		return { success: true, message: 'Data profil Anda berhasil diperbarui!' };
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const currentPassword = String(data.get('current_password') || '').trim();
		const newPassword = String(data.get('new_password') || '').trim();
		const confirmPassword = String(data.get('confirm_password') || '').trim();

		if (!currentPassword) {
			return fail(400, { error: 'Kata sandi saat ini wajib diisi' });
		}
		if (!newPassword || newPassword.length < 6) {
			return fail(400, { error: 'Kata sandi baru minimal 6 karakter' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Konfirmasi kata sandi baru tidak cocok' });
		}

		const [userRecord] = await sql`
			SELECT password_hash FROM absen_users WHERE id = ${locals.user.id} LIMIT 1;
		`;
		if (!userRecord) {
			return fail(404, { error: 'Akun tidak ditemukan' });
		}

		const isValid = await verifyPassword(currentPassword, userRecord.password_hash);
		if (!isValid) {
			return fail(400, { error: 'Kata sandi saat ini tidak tepat. Silakan coba lagi' });
		}

		const newHash = await hashPassword(newPassword);
		await sql`
			UPDATE absen_users 
			SET password_hash = ${newHash} 
			WHERE id = ${locals.user.id};
		`;

		return { success: true, message: 'Kata sandi Anda berhasil diperbarui!' };
	}
};

