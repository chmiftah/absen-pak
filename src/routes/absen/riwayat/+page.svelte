<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	function onMonthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		window.location.href = `/absen/riwayat?month=${target.value}`;
	}
</script>

<div class="container riwayat-container">
	<div class="header-card">
		<div>
			<a href="/absen" class="back-link">← Kembali ke Form Absen</a>
			<h1>Riwayat Kehadiran Saya</h1>
			<p>Pekerja: <strong>{data.karyawan.nama}</strong> ({data.karyawan.nama_jabatan || 'Pekerja'})</p>
		</div>

		<div class="filter-month">
			<label for="month-filter" class="form-label">Pilih Bulan:</label>
			<input
				id="month-filter"
				type="month"
				class="input"
				value={data.month}
				onchange={onMonthChange}
			/>
		</div>
	</div>

	<!-- Attendance Stats Cards (Tanpa Info Uang/Rate) -->
	<div class="grid grid-cols-4 stat-cards">
		<div class="card stat-card">
			<span class="stat-label">Hadir Normal</span>
			<span class="stat-value">{data.summary.totalHarian} <small>Hari</small></span>
			<span class="stat-sub">Shift Reguler</span>
		</div>

		<div class="card stat-card">
			<span class="stat-label">Lembur Jam</span>
			<span class="stat-value">{data.summary.totalLemburJam} <small>Jam</small></span>
			<span class="stat-sub">Total Jam Lembur</span>
		</div>

		<div class="card stat-card">
			<span class="stat-label">Lembur Hari Penuh</span>
			<span class="stat-value">{data.summary.totalLemburHari} <small>Hari</small></span>
			<span class="stat-sub">Shift Penuh Lembur</span>
		</div>

		<div class="card stat-card highlight-card">
			<span class="stat-label text-white">Total Hari Hadir</span>
			<span class="stat-value text-white grand-val">{Number(data.summary.totalHarian) + Number(data.summary.totalLemburHari)} <small>Hari</small></span>
			<span class="stat-sub text-white">Bulan {data.month}</span>
		</div>
	</div>

	<!-- History Table (Tanpa Info Uang/Rate) -->
	<div class="card table-card">
		<div class="card-header">
			<h2>Rincian Absensi Harian ({data.month})</h2>
			<span class="badge badge-primary">{data.attendances.length} Catatan</span>
		</div>

		{#if data.attendances.length === 0}
			<div class="empty-state">
				<p>Tidak ada rekaman kehadiran untuk bulan {data.month}.</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table class="data-table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Proyek</th>
							<th>Harian (Hari)</th>
							<th>Lembur (Jam)</th>
							<th>Lembur (Hari)</th>
							<th>Catatan</th>
						</tr>
					</thead>
					<tbody>
						{#each data.attendances as a}
							<tr>
								<td>
									<strong>
										{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
									</strong>
								</td>
								<td>{a.nama_projek}</td>
								<td>
									{#if Number(a.hadir_harian) === 0.5}
										<span class="badge badge-info">1/2 Hari</span>
									{:else if Number(a.hadir_harian) > 0}
										<span class="badge badge-success">1 Hari</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td>
									{#if Number(a.lembur_jam) > 0}
										<span class="badge badge-warning">{a.lembur_jam} Jam</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td>
									{#if Number(a.lembur_hari) > 0}
										<span class="badge badge-purple">1 Hari</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td class="text-muted">{a.keterangan || '-'}</td>
							</tr>
						{/each}
					</tbody>
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
	}

	.header-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 1rem;
		background: white;
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--primary);
		font-weight: 600;
		margin-bottom: 0.25rem;
		display: inline-block;
	}

	.filter-month {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.stat-cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 500px) {
		.stat-cards {
			grid-template-columns: 1fr;
		}
	}

	.stat-card {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-main);
	}

	.stat-value small {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.stat-sub {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.highlight-card {
		background: linear-gradient(135deg, var(--primary), var(--primary-hover));
	}

	.grand-val {
		font-size: 1.85rem;
	}

	.text-white {
		color: white !important;
	}

	.table-card {
		padding: 1.5rem;
	}

	.text-muted {
		color: var(--text-muted);
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
</style>
