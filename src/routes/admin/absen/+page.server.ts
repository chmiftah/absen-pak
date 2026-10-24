import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql } from '$lib/server/db';
import {
	formatLocalDate,
	formatIndoDate,
	getRunningWeekRange,
	getLastWeekRange,
	getCurrentMonthStr,
	getMonthRange
} from '$lib/dateUtils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/login');
	}

	const selectedProjek = url.searchParams.get('projek_id') ? Number(url.searchParams.get('projek_id')) : null;
	const selectedTanggal = url.searchParams.get('tanggal') || '';
	const rawPeriode = url.searchParams.get('periode');
	const customStart = url.searchParams.get('start_date') || '';
	const customEnd = url.searchParams.get('end_date') || '';

	const projects = await sql`
		SELECT id, nama_projek, status FROM absen_projek ORDER BY status ASC, id DESC;
	`;

	const employees = await sql`
		SELECT k.id, k.nama, k.rate_harian, k.rate_lembur_jam, k.rate_lembur_hari, k.projek_id,
		       j.nama_jabatan, p.nama_projek
		FROM absen_karyawan k
		LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
		LEFT JOIN absen_projek p ON p.id = k.projek_id
		WHERE k.status_aktif = true
		ORDER BY k.nama ASC;
	`;

	const runningWeek = getRunningWeekRange();

	// Determine active period: default is 'minggu_ini' (Minggu ini yang sedang berjalan)
	let periode = rawPeriode || '';
	if (!periode) {
		if (selectedTanggal) {
			periode = 'tanggal';
		} else if (customStart || customEnd) {
			periode = 'rentang';
		} else {
			periode = 'minggu_ini';
		}
	}

	let startDateStr = '';
	let endDateStr = '';
	let periodeLabel = '';

	if (periode === 'minggu_ini') {
		startDateStr = runningWeek.startStr;
		endDateStr = runningWeek.endStr;
		periodeLabel = `Minggu Ini (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (periode === 'hari_ini') {
		const todayStr = formatLocalDate();
		startDateStr = todayStr;
		endDateStr = todayStr;
		periodeLabel = `Hari Ini (${formatIndoDate(todayStr)})`;
	} else if (periode === 'minggu_lalu') {
		const lastWeek = getLastWeekRange();
		startDateStr = lastWeek.startStr;
		endDateStr = lastWeek.endStr;
		periodeLabel = `Minggu Lalu (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (periode === 'bulan_ini') {
		const curMonth = getCurrentMonthStr();
		const mRange = getMonthRange(curMonth);
		startDateStr = mRange.startStr;
		endDateStr = mRange.endStr;
		periodeLabel = `Bulan Ini (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (periode === 'rentang') {
		startDateStr = customStart || runningWeek.startStr;
		endDateStr = customEnd || runningWeek.endStr;
		periodeLabel = `Rentang (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	} else if (periode === 'tanggal') {
		startDateStr = selectedTanggal;
		endDateStr = selectedTanggal;
		periodeLabel = `Tanggal: ${formatIndoDate(selectedTanggal)}`;
	} else if (periode === 'semua') {
		startDateStr = '';
		endDateStr = '';
		periodeLabel = 'Semua Waktu';
	} else {
		periode = 'minggu_ini';
		startDateStr = runningWeek.startStr;
		endDateStr = runningWeek.endStr;
		periodeLabel = `Minggu Ini (${formatIndoDate(startDateStr)} - ${formatIndoDate(endDateStr)})`;
	}

	// Attendance query with filters
	let attendances;
	if (periode === 'semua') {
		if (selectedProjek) {
			attendances = await sql`
				SELECT a.*, k.nama as nama_karyawan, k.projek_id as master_projek_id, j.nama_jabatan, p.nama_projek
				FROM absen_kehadiran a
				JOIN absen_karyawan k ON k.id = a.karyawan_id
				LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
				JOIN absen_projek p ON p.id = a.projek_id
				WHERE a.projek_id = ${selectedProjek}
				ORDER BY a.tanggal DESC, k.nama ASC;
			`;
		} else {
			attendances = await sql`
				SELECT a.*, k.nama as nama_karyawan, k.projek_id as master_projek_id, j.nama_jabatan, p.nama_projek
				FROM absen_kehadiran a
				JOIN absen_karyawan k ON k.id = a.karyawan_id
				LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
				JOIN absen_projek p ON p.id = a.projek_id
				ORDER BY a.tanggal DESC, k.nama ASC
				LIMIT 200;
			`;
		}
	} else {
		if (selectedProjek) {
			attendances = await sql`
				SELECT a.*, k.nama as nama_karyawan, k.projek_id as master_projek_id, j.nama_jabatan, p.nama_projek
				FROM absen_kehadiran a
				JOIN absen_karyawan k ON k.id = a.karyawan_id
				LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
				JOIN absen_projek p ON p.id = a.projek_id
				WHERE a.projek_id = ${selectedProjek}
				  AND a.tanggal >= ${startDateStr}
				  AND a.tanggal <= ${endDateStr}
				ORDER BY a.tanggal DESC, k.nama ASC;
			`;
		} else {
			attendances = await sql`
				SELECT a.*, k.nama as nama_karyawan, k.projek_id as master_projek_id, j.nama_jabatan, p.nama_projek
				FROM absen_kehadiran a
				JOIN absen_karyawan k ON k.id = a.karyawan_id
				LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
				JOIN absen_projek p ON p.id = a.projek_id
				WHERE a.tanggal >= ${startDateStr}
				  AND a.tanggal <= ${endDateStr}
				ORDER BY a.tanggal DESC, k.nama ASC;
			`;
		}
	}

	return {
		projects,
		employees,
		attendances,
		selectedProjek,
		periode,
		selectedTanggal,
		startDateStr,
		endDateStr,
		periodeLabel,
		runningWeek
	};
};

export const actions: Actions = {
	inputManual: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const karyawanId = Number(data.get('karyawan_id'));
		const projekId = Number(data.get('projek_id'));
		const tanggal = String(data.get('tanggal') || '').trim();
		const rawHadir = data.get('hadir_harian');
		let hadirHarian = 0;
		if (rawHadir === '0.5' || rawHadir === 'setengah') {
			hadirHarian = 0.5;
		} else if (rawHadir === '1' || rawHadir === 'on' || rawHadir === 'penuh') {
			hadirHarian = 1;
		} else {
			hadirHarian = Math.max(0, Number(rawHadir) || 0);
		}
		const lemburJam = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const lemburHari = data.get('lembur_hari') === 'on' || data.get('lembur_hari') === '1' ? 1 : 0;
		const keterangan = String(data.get('keterangan') || '').trim();

		if (!karyawanId || !projekId || !tanggal) {
			return fail(400, { error: 'Karyawan, proyek, dan tanggal wajib diisi' });
		}

		// Fetch current employee info for snapshot and master project verification
		const [k] = await sql`
			SELECT k.*, p.nama_projek 
			FROM absen_karyawan k 
			LEFT JOIN absen_projek p ON p.id = k.projek_id 
			WHERE k.id = ${karyawanId};
		`;
		if (!k) return fail(400, { error: 'Karyawan tidak ditemukan' });

		// Validasi lokasi absensi harus sesuai data master
		if (k.projek_id && Number(projekId) !== Number(k.projek_id)) {
			return fail(400, {
				error: `Pekerja ${k.nama} terdaftar di proyek "${k.nama_projek || ''}" pada data master. Absensi harus sesuai lokasi data master!`
			});
		}

		const customRateHarian = data.has('snapshot_rate_harian') && data.get('snapshot_rate_harian') !== '' 
			? Math.max(0, Number(data.get('snapshot_rate_harian')) || 0)
			: Number(k.rate_harian);
		const customRateLemburJam = data.has('snapshot_rate_lembur_jam') && data.get('snapshot_rate_lembur_jam') !== ''
			? Math.max(0, Number(data.get('snapshot_rate_lembur_jam')) || 0)
			: Number(k.rate_lembur_jam);
		const customRateLemburHari = data.has('snapshot_rate_lembur_hari') && data.get('snapshot_rate_lembur_hari') !== ''
			? Math.max(0, Number(data.get('snapshot_rate_lembur_hari')) || 0)
			: Number(k.rate_lembur_hari);

		await sql`
			INSERT INTO absen_kehadiran (
				karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari, keterangan,
				snapshot_rate_harian, snapshot_rate_lembur_jam, snapshot_rate_lembur_hari, updated_at
			)
			VALUES (
				${karyawanId}, ${projekId}, ${tanggal}, ${hadirHarian}, ${lemburJam}, ${lemburHari}, ${keterangan},
				${customRateHarian}, ${customRateLemburJam}, ${customRateLemburHari}, NOW()
			)
			ON CONFLICT (karyawan_id, projek_id, tanggal) DO UPDATE SET
				hadir_harian = EXCLUDED.hadir_harian,
				lembur_jam = EXCLUDED.lembur_jam,
				lembur_hari = EXCLUDED.lembur_hari,
				keterangan = EXCLUDED.keterangan,
				snapshot_rate_harian = EXCLUDED.snapshot_rate_harian,
				snapshot_rate_lembur_jam = EXCLUDED.snapshot_rate_lembur_jam,
				snapshot_rate_lembur_hari = EXCLUDED.snapshot_rate_lembur_hari,
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
		const rawHadir = data.get('hadir_harian');
		let hadirHarian = 0;
		if (rawHadir === '0.5' || rawHadir === 'setengah') {
			hadirHarian = 0.5;
		} else if (rawHadir === '1' || rawHadir === 'on' || rawHadir === 'penuh') {
			hadirHarian = 1;
		} else {
			hadirHarian = Math.max(0, Number(rawHadir) || 0);
		}
		const lemburJam = Math.max(0, Number(data.get('lembur_jam')) || 0);
		const lemburHari = data.get('lembur_hari') === 'on' || data.get('lembur_hari') === '1' ? 1 : 0;
		const keterangan = String(data.get('keterangan') || '').trim();
		const rateHarian = data.has('snapshot_rate_harian') ? Math.max(0, Number(data.get('snapshot_rate_harian')) || 0) : null;
		const rateLemburJam = data.has('snapshot_rate_lembur_jam') ? Math.max(0, Number(data.get('snapshot_rate_lembur_jam')) || 0) : null;
		const rateLemburHari = data.has('snapshot_rate_lembur_hari') ? Math.max(0, Number(data.get('snapshot_rate_lembur_hari')) || 0) : null;
		const updateMasterRate = data.get('update_master_rate') === 'on' || data.get('update_master_rate') === 'true';

		if (!id) return fail(400, { error: 'ID absensi tidak ditemukan' });
		if (!projekId || !tanggal) return fail(400, { error: 'Proyek dan tanggal wajib diisi' });

		const [att] = await sql`
			SELECT a.id, a.karyawan_id, k.nama, k.projek_id as master_projek_id, p.nama_projek as master_projek_nama
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			LEFT JOIN absen_projek p ON p.id = k.projek_id
			WHERE a.id = ${id};
		`;
		if (!att) return fail(400, { error: 'ID absensi tidak ditemukan' });

		if (att.master_projek_id && Number(projekId) !== Number(att.master_projek_id)) {
			return fail(400, {
				error: `Pekerja ${att.nama} terdaftar di proyek "${att.master_projek_nama || ''}" pada data master. Lokasi proyek tidak dapat diubah ke proyek lain.`
			});
		}

		// Cek jika tanggal diubah, pastikan tidak bentrok dengan absensi lain di tanggal tujuan
		const [conflict] = await sql`
			SELECT id FROM absen_kehadiran
			WHERE karyawan_id = ${att.karyawan_id}
			  AND projek_id = ${projekId}
			  AND tanggal = ${tanggal}
			  AND id != ${id}
			LIMIT 1;
		`;
		if (conflict) {
			return fail(400, {
				error: `Pekerja ${att.nama} sudah memiliki catatan absensi pada tanggal ${tanggal} di proyek ini.`
			});
		}

		await sql`
			UPDATE absen_kehadiran
			SET projek_id = ${projekId},
			    tanggal = ${tanggal},
			    hadir_harian = ${hadirHarian},
			    lembur_jam = ${lemburJam},
			    lembur_hari = ${lemburHari},
			    keterangan = ${keterangan},
			    snapshot_rate_harian = COALESCE(${rateHarian}, snapshot_rate_harian),
			    snapshot_rate_lembur_jam = COALESCE(${rateLemburJam}, snapshot_rate_lembur_jam),
			    snapshot_rate_lembur_hari = COALESCE(${rateLemburHari}, snapshot_rate_lembur_hari),
			    updated_at = NOW()
			WHERE id = ${id};
		`;

		if (updateMasterRate && rateHarian !== null) {
			await sql`
				UPDATE absen_karyawan
				SET rate_harian = ${rateHarian},
				    rate_lembur_jam = COALESCE(${rateLemburJam}, rate_lembur_jam),
				    rate_lembur_hari = COALESCE(${rateLemburHari}, rate_lembur_hari),
				    updated_at = NOW()
				WHERE id = ${att.karyawan_id};
			`;
		}

		return { success: true, message: 'Data absensi & upah berhasil diperbarui!' };
	},

	updateUpahHariIni: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const rateHarian = Math.max(0, Number(data.get('snapshot_rate_harian')) || 0);
		const rateLemburJam = Math.max(0, Number(data.get('snapshot_rate_lembur_jam')) || 0);
		const rateLemburHari = Math.max(0, Number(data.get('snapshot_rate_lembur_hari')) || 0);
		const updateMasterRate = data.get('update_master_rate') === 'on' || data.get('update_master_rate') === 'true';

		if (!id) return fail(400, { error: 'ID absensi tidak ditemukan' });

		const [att] = await sql`
			SELECT a.id, a.karyawan_id, k.nama
			FROM absen_kehadiran a
			JOIN absen_karyawan k ON k.id = a.karyawan_id
			WHERE a.id = ${id};
		`;
		if (!att) return fail(400, { error: 'Data absensi tidak ditemukan' });

		await sql`
			UPDATE absen_kehadiran
			SET snapshot_rate_harian = ${rateHarian},
			    snapshot_rate_lembur_jam = ${rateLemburJam},
			    snapshot_rate_lembur_hari = ${rateLemburHari},
			    updated_at = NOW()
			WHERE id = ${id};
		`;

		if (updateMasterRate) {
			await sql`
				UPDATE absen_karyawan
				SET rate_harian = ${rateHarian},
				    rate_lembur_jam = ${rateLemburJam},
				    rate_lembur_hari = ${rateLemburHari},
				    updated_at = NOW()
				WHERE id = ${att.karyawan_id};
			`;
		}

		return { success: true, message: `Upah untuk ${att.nama} berhasil diperbarui!` };
	},

	hapus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const id = Number(data.get('id'));

		await sql`DELETE FROM absen_kehadiran WHERE id = ${id};`;
		return { success: true, message: 'Catatan absensi berhasil dihapus' };
	},

	hapusBatch: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/login');

		const data = await request.formData();
		const rawValues = data.getAll('ids');
		const ids: number[] = [];
		for (const val of rawValues) {
			if (typeof val === 'string') {
				for (const part of val.split(',')) {
					const num = Number(part.trim());
					if (!isNaN(num) && num > 0) {
						ids.push(num);
					}
				}
			}
		}

		const uniqueIds = Array.from(new Set(ids));
		if (uniqueIds.length === 0) {
			return fail(400, { error: 'Pilih minimal satu data absensi untuk dihapus' });
		}

		await sql`DELETE FROM absen_kehadiran WHERE id = ANY(${uniqueIds});`;
		return { success: true, message: `Berhasil menghapus ${uniqueIds.length} data absensi terpilih!` };
	}
};

