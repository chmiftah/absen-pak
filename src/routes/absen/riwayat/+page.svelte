<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	const BULAN_INDO = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	function formatMonthTitle(monthStr: string) {
		if (!monthStr) return '';
		const [y, m] = monthStr.split('-').map(Number);
		if (!y || !m) return monthStr;
		return `${BULAN_INDO[m - 1]} ${y}`;
	}

	function parseDateInfo(dateVal: any) {
		const d = new Date(dateVal);
		const dayIdx = d.getDay();
		const hari = HARI_INDO[dayIdx] || '';
		const tgl = d.getDate();
		const bln = BULAN_INDO[d.getMonth()]?.slice(0, 3) || '';
		const thn = d.getFullYear();
		return {
			hari,
			tanggalFormat: `${tgl} ${bln} ${thn}`,
			isSunday: dayIdx === 0
		};
	}

	function onMonthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			window.location.href = `/absen/riwayat?month=${target.value}`;
		}
	}

	function prevMonth() {
		const [y, m] = data.month.split('-').map(Number);
		const prev = new Date(y, m - 2, 1);
		const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
		window.location.href = `/absen/riwayat?month=${prevStr}`;
	}

	function nextMonth() {
		const [y, m] = data.month.split('-').map(Number);
		const next = new Date(y, m, 1);
		const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
		window.location.href = `/absen/riwayat?month=${nextStr}`;
	}

	function currentMonth() {
		const nowStr = new Date().toISOString().slice(0, 7);
		window.location.href = `/absen/riwayat?month=${nowStr}`;
	}
</script>

<svelte:head>
	<title>Riwayat Absensi - {data.karyawan.nama} ({formatMonthTitle(data.month)})</title>
</svelte:head>

<div class="container riwayat-container">
	<!-- Top Header Card -->
	<div class="card header-card">
		<div class="header-left">
			<a href="/absen" class="back-link">
				← Kembali ke Form Absensi
			</a>
			<div class="header-title-row">
				<h1>Riwayat Kehadiran Saya</h1>
				<span class="worker-badge">👷 {data.karyawan.nama}</span>
			</div>
			<p class="header-sub">
				Jabatan: <strong>{data.karyawan.nama_jabatan || 'Pekerja Lapangan'}</strong> • Periode: <strong class="text-primary">{formatMonthTitle(data.month)}</strong>
			</p>
		</div>

		<!-- Month Selector with Arrows -->
		<div class="month-selector-box">
			<span class="selector-label">Pilih Periode Bulan</span>
			<div class="month-nav-group">
				<button type="button" class="btn-nav-month" onclick={prevMonth} title="Bulan Sebelumnya">
					◀
				</button>
				<input
					id="month-filter"
					type="month"
					class="input input-month"
					value={data.month}
					onchange={onMonthChange}
				/>
				<button type="button" class="btn-nav-month" onclick={nextMonth} title="Bulan Berikutnya">
					▶
				</button>
				<button type="button" class="btn btn-secondary btn-sm btn-today" onclick={currentMonth} title="Kembali ke Bulan Ini">
					Bulan Ini
				</button>
			</div>
		</div>
	</div>

	<!-- Attendance Stats Cards -->
	<div class="stats-grid">
		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-label">Hadir Normal</span>
				<span class="stat-icon">👷</span>
			</div>
			<div class="stat-value">{data.summary.totalHarian} <small>Hari</small></div>
			<div class="stat-sub">Presensi Shift Reguler</div>
		</div>

		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-label">Lembur Jam</span>
				<span class="stat-icon">⏱️</span>
			</div>
			<div class="stat-value">{data.summary.totalLemburJam} <small>Jam</small></div>
			<div class="stat-sub">Total Waktu Lembur</div>
		</div>

		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-label">Lembur Hari</span>
				<span class="stat-icon">🌙</span>
			</div>
			<div class="stat-value">{data.summary.totalLemburHari} <small>Hari</small></div>
			<div class="stat-sub">Shift Penuh Tambahan</div>
		</div>

		<div class="card stat-card highlight-card">
			<div class="stat-top">
				<span class="stat-label text-white-muted">Total Hadir</span>
				<span class="stat-icon">🎯</span>
			</div>
			<div class="stat-value text-white grand-val">
				{Number(data.summary.totalHarian) + Number(data.summary.totalLemburHari)} <small class="text-white-muted">Hari</small>
			</div>
			<div class="stat-sub text-white-muted">Akumulasi {formatMonthTitle(data.month)}</div>
		</div>
	</div>

	<!-- History Table Card -->
	<div class="card table-card">
		<div class="card-header table-header-flex">
			<div class="table-header-title">
				<h2>Rincian Absensi Harian</h2>
				<span class="period-pill">📅 {formatMonthTitle(data.month)}</span>
				<span class="count-pill">{data.attendances.length} Rekaman</span>
			</div>

			<a href="/absen" class="btn btn-primary btn-sm">
				✍️ Input Absen Baru
			</a>
		</div>

		{#if data.attendances.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<h3>Belum Ada Catatan Kehadiran</h3>
				<p>Tidak ditemukan data presensi masuk Anda untuk periode <strong>{formatMonthTitle(data.month)}</strong>.</p>
				<a href="/absen" class="btn btn-primary">
					✍️ Isi Absen Sekarang
				</a>
			</div>
		{:else}
			<div class="table-responsive">
				<table class="riwayat-table">
					<thead>
						<tr>
							<th class="th-no">No.</th>
							<th class="th-date">Hari & Tanggal</th>
							<th class="th-proj">Lokasi Proyek</th>
							<th class="th-hadir">Hadir (Hari)</th>
							<th class="th-lembur-jam">Lembur (Jam)</th>
							<th class="th-lembur-hari">Lembur (Hari)</th>
							<th class="th-note">Catatan / Keterangan</th>
						</tr>
					</thead>
					<tbody>
						{#each data.attendances as a, i}
							{@const dateInfo = parseDateInfo(a.tanggal)}
							<tr class="{dateInfo.isSunday ? 'row-sunday' : ''}">
								<td class="td-no">{i + 1}</td>
								<td class="td-date">
									<div class="date-wrapper">
										<span class="day-tag {dateInfo.isSunday ? 'sunday-tag' : ''}">
											{dateInfo.hari}
										</span>
										<span class="date-text">
											{dateInfo.tanggalFormat}
										</span>
									</div>
								</td>
								<td class="td-proj">
									<div class="project-pill">
										<span class="project-icon">🏗️</span>
										<span class="project-name">{a.nama_projek || 'Umum'}</span>
									</div>
								</td>
								<td class="td-hadir">
									{#if Number(a.hadir_harian) === 1}
										<span class="badge badge-success badge-pill">
											<span class="badge-icon">✓</span> 1 Hari
										</span>
									{:else if Number(a.hadir_harian) === 0.5}
										<span class="badge badge-info badge-pill">
											<span class="badge-icon">½</span> Setengah Hari
										</span>
									{:else}
										<span class="badge badge-neutral badge-pill">-</span>
									{/if}
								</td>
								<td class="td-lembur-jam">
									{#if Number(a.lembur_jam) > 0}
										<span class="badge badge-warning badge-pill">
											<span class="badge-icon">⏱️</span> {a.lembur_jam} Jam
										</span>
									{:else}
										<span class="empty-dash">-</span>
									{/if}
								</td>
								<td class="td-lembur-hari">
									{#if Number(a.lembur_hari) > 0}
										<span class="badge badge-purple badge-pill">
											<span class="badge-icon">🌙</span> 1 Hari Penuh
										</span>
									{:else}
										<span class="empty-dash">-</span>
									{/if}
								</td>
								<td class="td-note">
									{#if a.keterangan}
										<div class="note-box" title={a.keterangan}>
											<span class="note-icon">💬</span>
											<span class="note-text">{a.keterangan}</span>
										</div>
									{:else}
										<span class="empty-dash">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="tfoot-row">
							<td colspan="3" class="tfoot-label">
								<strong>TOTAL REKAPITULASI ({data.attendances.length} HARI)</strong>
							</td>
							<td class="tfoot-hadir">
								<strong>{data.summary.totalHarian} Hari</strong>
							</td>
							<td class="tfoot-lembur-jam">
								<strong>{data.summary.totalLemburJam} Jam</strong>
							</td>
							<td class="tfoot-lembur-hari">
								<strong>{data.summary.totalLemburHari} Hari</strong>
							</td>
							<td class="tfoot-note">
								<span class="tfoot-grand-text">Total: <strong>{Number(data.summary.totalHarian) + Number(data.summary.totalLemburHari)} Hari Kerja</strong></span>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.riwayat-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Header Card */
	.header-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.25rem;
		padding: 1.5rem 1.75rem;
		background: #ffffff;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
		margin-bottom: 0.15rem;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	.header-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.header-title-row h1 {
		font-size: 1.6rem;
		margin: 0;
		color: var(--text-main);
	}

	.worker-badge {
		background: var(--primary-light);
		color: var(--primary);
		border: 1px solid #bfdbfe;
		padding: 0.2rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.header-sub {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.text-primary {
		color: var(--primary);
	}

	/* Month Navigation Box */
	.month-selector-box {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.selector-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.month-nav-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.btn-nav-month {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		color: var(--text-main);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.btn-nav-month:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		color: var(--primary);
	}

	.input-month {
		width: 155px;
		height: 36px;
		padding: 0.3rem 0.65rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.btn-today {
		height: 36px;
		padding: 0 0.85rem;
		white-space: nowrap;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.25rem;
	}

	.stat-card {
		padding: 1.25rem;
		border-radius: var(--radius-md);
		background: white;
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		box-shadow: var(--shadow-sm);
	}

	.stat-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stat-label {
		font-size: 0.775rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-icon {
		font-size: 1.25rem;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.1;
	}

	.stat-value small {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.stat-sub {
		font-size: 0.775rem;
		color: var(--text-muted);
	}

	.highlight-card {
		background: linear-gradient(135deg, #1d4ed8, #2563eb);
		border-color: #1e40af;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
	}

	.text-white {
		color: #ffffff !important;
	}

	.text-white-muted {
		color: rgba(255, 255, 255, 0.82) !important;
	}

	.grand-val {
		font-size: 1.85rem;
	}

	/* Table Card */
	.table-card {
		background: #ffffff;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		padding: 0;
	}

	.table-header-flex {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.85rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-subtle);
		background: #fafafa;
	}

	.table-header-title {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.table-header-title h2 {
		font-size: 1.15rem;
		margin: 0;
		color: var(--text-main);
	}

	.period-pill {
		background: #f1f5f9;
		color: #334155;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		border: 1px solid #cbd5e1;
	}

	.count-pill {
		background: #eff6ff;
		color: #1d4ed8;
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		border: 1px solid #bfdbfe;
	}

	/* Table Styles */
	.table-responsive {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.riwayat-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 0.875rem;
		text-align: left;
	}

	.riwayat-table th {
		background: #f8fafc;
		font-weight: 700;
		font-size: 0.775rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		padding: 0.95rem 1rem;
		border-bottom: 2px solid var(--border-subtle);
		white-space: nowrap;
	}

	.riwayat-table td {
		padding: 0.95rem 1rem;
		border-bottom: 1px solid var(--border-subtle);
		color: var(--text-main);
		vertical-align: middle;
	}

	.riwayat-table tbody tr {
		transition: background-color 0.12s ease;
	}

	.riwayat-table tbody tr:hover td {
		background-color: #f8fafc;
	}

	.row-sunday td {
		background-color: #fffbfb;
	}

	.th-no, .td-no {
		width: 50px;
		text-align: center;
		color: var(--text-light);
		font-weight: 600;
	}

	.th-date { min-width: 180px; }
	.th-proj { min-width: 160px; }
	.th-hadir { min-width: 140px; }
	.th-lembur-jam { min-width: 130px; }
	.th-lembur-hari { min-width: 140px; }
	.th-note { min-width: 180px; }

	/* Date Cell */
	.date-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.day-tag {
		background: #f1f5f9;
		color: #475569;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.sunday-tag {
		background: #fee2e2;
		color: #dc2626;
	}

	.date-text {
		font-weight: 600;
		color: var(--text-main);
	}

	/* Project Pill */
	.project-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 600;
		color: #334155;
	}

	.project-icon {
		font-size: 1rem;
	}

	/* Badges */
	.badge-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.badge-icon {
		font-size: 0.85rem;
		font-weight: 800;
	}

	.empty-dash {
		color: var(--text-light);
		font-size: 1.1rem;
		padding-left: 0.5rem;
	}

	/* Note Box */
	.note-box {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		padding: 0.25rem 0.65rem;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: #475569;
		max-width: 260px;
	}

	.note-icon {
		font-size: 0.85rem;
		flex-shrink: 0;
	}

	.note-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Table Footer */
	.tfoot-row td {
		background: #f1f5f9;
		padding: 1.1rem 1rem;
		border-top: 2px solid var(--border-strong);
		border-bottom: none;
		font-size: 0.875rem;
	}

	.tfoot-label {
		color: #334155;
		letter-spacing: 0.03em;
		font-size: 0.8rem;
	}

	.tfoot-hadir strong {
		color: #059669;
		font-size: 0.95rem;
	}

	.tfoot-lembur-jam strong {
		color: #d97706;
		font-size: 0.95rem;
	}

	.tfoot-lembur-hari strong {
		color: #7c3aed;
		font-size: 0.95rem;
	}

	.tfoot-grand-text {
		font-size: 0.85rem;
		color: #1e40af;
	}

	.tfoot-grand-text strong {
		font-weight: 800;
		color: #1e3a8a;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3.5rem 1.5rem;
		text-align: center;
		gap: 0.75rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.25rem;
	}

	.empty-state h3 {
		font-size: 1.2rem;
		color: var(--text-main);
		margin: 0;
	}

	.empty-state p {
		font-size: 0.9rem;
		color: var(--text-muted);
		max-width: 420px;
		margin: 0 0 0.5rem 0;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.header-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.month-selector-box {
			width: 100%;
		}

		.month-nav-group {
			width: 100%;
		}

		.input-month {
			flex: 1;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.table-header-flex {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
