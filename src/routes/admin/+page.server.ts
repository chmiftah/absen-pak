import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	if (locals.user.role !== 'ADMIN') {
		throw redirect(303, '/absen');
	}

	const today = new Date().toISOString().split('T')[0];

	// Count projects
	const [projectCount] = await sql`
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'AKTIF') as aktif
		FROM absen_projek;
	`;

	// Count employees
	const [employeeCount] = await sql`
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status_aktif = true) as aktif
		FROM absen_karyawan;
	`;

	// Count attendances today
	const [attendanceToday] = await sql`
		SELECT 
			COUNT(DISTINCT karyawan_id) as total_pekerja,
			COALESCE(SUM(hadir_harian), 0) as total_harian,
			COALESCE(SUM(lembur_jam), 0) as total_lembur_jam,
			COALESCE(SUM(lembur_hari), 0) as total_lembur_hari
		FROM absen_kehadiran
		WHERE tanggal = ${today};
	`;

	// Recent attendances with employee and project info
	const recentAttendances = await sql`
		SELECT 
			a.*,
			k.nama as nama_karyawan,
			j.nama_jabatan,
			p.nama_projek
		FROM absen_kehadiran a
		JOIN absen_karyawan k ON k.id = a.karyawan_id
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		JOIN absen_projek p ON p.id = a.projek_id
		ORDER BY a.tanggal DESC, a.created_at DESC
		LIMIT 10;
	`;

	// Active projects for quick filter
	const activeProjects = await sql`
		SELECT id, nama_projek, lokasi
		FROM absen_projek
		WHERE status = 'AKTIF'
		ORDER BY id ASC;
	`;

	return {
		stats: {
			totalProjects: Number(projectCount.total),
			activeProjectsCount: Number(projectCount.aktif),
			totalEmployees: Number(employeeCount.total),
			activeEmployeesCount: Number(employeeCount.aktif),
			workersToday: Number(attendanceToday.total_pekerja),
			harianToday: Number(attendanceToday.total_harian),
			lemburJamToday: Number(attendanceToday.total_lembur_jam),
			lemburHariToday: Number(attendanceToday.total_lembur_hari)
		},
		activeProjects,
		recentAttendances,
		today
	};
};
