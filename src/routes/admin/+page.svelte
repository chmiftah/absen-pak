<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	function formatRupiah(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}
</script>

<div class="container admin-dashboard">
	<!-- Hero Header -->
	<div class="dash-hero">
		<div>
			<span class="badge badge-primary">Panel Kendali Proyek</span>
			<h1>Dashboard Administrator</h1>
			<p>Kelola absensi mandiri tukang, master data rate gaji, dan laporan penggajian lapangan.</p>
		</div>

		<div class="hero-actions">
			<a href="/admin/laporan" class="btn btn-primary btn-lg">
				💰 Buka Laporan Gaji & Cetak PDF
			</a>
			<a href="/admin/absen" class="btn btn-secondary">
				📋 Rekap Absensi
			</a>
		</div>
	</div>

	<!-- Top Metric Cards -->
	<div class="grid grid-cols-4 stat-grid">
		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-title">Pekerja Hadir Hari Ini</span>
				<span class="stat-icon">👷</span>
			</div>
			<div class="stat-number">{data.stats.workersToday} <small>Orang</small></div>
			<div class="stat-desc">
				Harian: {data.stats.harianToday} | Lembur: {data.stats.lemburJamToday} Jam | Lembur Hari: {data.stats.lemburHariToday}
			</div>
		</div>

		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-title">Total Karyawan Terdaftar</span>
				<span class="stat-icon">👥</span>
			</div>
			<div class="stat-number">{data.stats.activeEmployeesCount} <small>Aktif</small></div>
			<div class="stat-desc">Dari total {data.stats.totalEmployees} pekerja</div>
		</div>

		<div class="card stat-card">
			<div class="stat-top">
				<span class="stat-title">Proyek Konstruksi</span>
				<span class="stat-icon">🏗️</span>
			</div>
			<div class="stat-number">{data.stats.activeProjectsCount} <small>Aktif</small></div>
			<div class="stat-desc">Dari {data.stats.totalProjects} total proyek</div>
		</div>

		<div class="card stat-card stat-action-card">
			<div class="stat-top">
				<span class="stat-title">Akses Cepat Penggajian</span>
				<span class="stat-icon">📄</span>
			</div>
			<p class="stat-desc-box">Format matrix mingguan persis lembar foto asli</p>
			<a href="/admin/laporan" class="btn btn-primary btn-sm btn-full">
				Lihat Matrix Penggajian ➔
			</a>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="dash-content-grid">
		<!-- Left: Recent Attendances -->
		<div class="card recent-card">
			<div class="card-header">
				<div>
					<h2>Aktivitas Absensi Terbaru</h2>
					<p class="subtitle">Absen yang baru saja dimasukkan oleh tukang atau admin</p>
				</div>
				<a href="/admin/absen" class="btn btn-secondary btn-sm">Lihat Semua Absen ➔</a>
			</div>

			{#if data.recentAttendances.length === 0}
				<div class="empty-state">
					<p>Belum ada data absensi tercatat.</p>
				</div>
			{:else}
				<div class="table-responsive">
					<table class="dash-table">
						<thead>
							<tr>
								<th>Pekerja</th>
								<th>Proyek</th>
								<th>Tanggal</th>
								<th>Kehadiran</th>
								<th class="text-right">Upah Terhitung</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentAttendances as r}
								{@const subHarian = Number(r.hadir_harian) * Number(r.snapshot_rate_harian)}
								{@const subJam = Number(r.lembur_jam) * Number(r.snapshot_rate_lembur_jam)}
								{@const subLHari = Number(r.lembur_hari) * Number(r.snapshot_rate_lembur_hari)}
								{@const totalH = subHarian + subJam + subLHari}
								<tr>
									<td>
										<div class="worker-name-cell">
											<strong>{r.nama_karyawan}</strong>
											<span class="badge badge-neutral">{r.nama_jabatan || 'Tukang'}</span>
										</div>
									</td>
									<td>{r.nama_projek}</td>
									<td>
										{new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
									</td>
									<td>
										<div class="badges-row">
											{#if Number(r.hadir_harian) === 0.5}
												<span class="badge badge-info">1/2 Hari (0.5)</span>
											{:else if Number(r.hadir_harian) > 0}
												<span class="badge badge-success">Harian (1)</span>
											{/if}
											{#if Number(r.lembur_jam) > 0}
												<span class="badge badge-warning">{r.lembur_jam} Jam</span>
											{/if}
											{#if Number(r.lembur_hari) > 0}
												<span class="badge badge-purple">Lembur Hari (1)</span>
											{/if}
										</div>
									</td>
									<td class="text-right font-bold">{formatRupiah(totalH)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Right: Quick Navigation & Info -->
		<div class="right-col">
			<div class="card menu-card">
				<div class="card-header">
					<h2>Menu Navigasi</h2>
				</div>
				<div class="quick-links-list">
					<a href="/admin/laporan" class="quick-menu-item highlight-item">
						<span class="qm-icon">💰</span>
						<div>
							<strong>Laporan Penggajian & Cetak PDF</strong>
							<p>Format matrix mingguan persis seperti lembar foto Anda</p>
						</div>
					</a>

					<a href="/admin/karyawan" class="quick-menu-item">
						<span class="qm-icon">👷</span>
						<div>
							<strong>Master Karyawan, Jabatan & Rate</strong>
							<p>Atur tarif gaji harian, lembur jam, dan lembur hari</p>
						</div>
					</a>

					<a href="/admin/proyek" class="quick-menu-item">
						<span class="qm-icon">🏗️</span>
						<div>
							<strong>Master Data Proyek</strong>
							<p>Kelola daftar lokasi kerja proyek aktif</p>
						</div>
					</a>

					<a href="/admin/absen" class="quick-menu-item">
						<span class="qm-icon">✍️</span>
						<div>
							<strong>Koreksi / Input Absen Lapangan</strong>
							<p>Bantu input absen tukang yang berhalangan membawa HP</p>
						</div>
					</a>
				</div>
			</div>

			<!-- Notice Snapshot Card -->
			<div class="card notice-card">
				<div class="notice-header">
					<span>💡</span>
					<strong>Fitur Keamanan Snapshot Gaji</strong>
				</div>
				<p>
					Sistem telah dilengkapi fitur <em>Rate Snapshot</em>: jika Anda mengubah tarif gaji pekerja hari ini, seluruh rekaman absensi bulan-bulan sebelumnya <strong>tidak akan berubah</strong>. Riwayat penggajian masa lalu tetap 100% akurat sesuai rate aslinya.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.admin-dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.dash-hero {
		background: white;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.dash-hero h1 {
		font-size: 1.85rem;
		margin-top: 0.35rem;
		margin-bottom: 0.25rem;
	}

	.dash-hero p {
		color: var(--text-muted);
		max-width: 650px;
	}

	.hero-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.stat-grid {
		margin-bottom: 0.5rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1.25rem;
	}

	.stat-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-icon {
		font-size: 1.25rem;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-main);
		margin: 0.35rem 0;
	}

	.stat-number small {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.stat-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.stat-desc-box {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.stat-action-card {
		background: #f8fafc;
	}

	.dash-content-grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 1024px) {
		.dash-content-grid { grid-template-columns: 1fr; }
	}

	.table-responsive {
		overflow-x: auto;
	}

	.dash-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	.dash-table th, .dash-table td {
		padding: 0.75rem 0.85rem;
		border-bottom: 1px solid var(--border-subtle);
		text-align: left;
	}

	.dash-table th {
		background: var(--bg-subtle);
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.worker-name-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badges-row {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.font-bold {
		font-weight: 700;
		color: #0f172a;
	}

	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.quick-links-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quick-menu-item {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
		padding: 0.85rem 1rem;
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.quick-menu-item:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		transform: translateY(-1px);
	}

	.highlight-item {
		background: #eff6ff;
		border-color: #bfdbfe;
	}

	.qm-icon {
		font-size: 1.3rem;
	}

	.quick-menu-item strong {
		font-size: 0.9rem;
		color: var(--text-main);
	}

	.quick-menu-item p {
		font-size: 0.775rem;
		color: var(--text-muted);
		margin-top: 0.15rem;
	}

	.notice-card {
		background: #fffbeb;
		border-color: #fde68a;
		padding: 1.25rem;
	}

	.notice-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
		color: #92400e;
		font-size: 0.9rem;
	}

	.notice-card p {
		font-size: 0.825rem;
		color: #78350f;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
</style>
