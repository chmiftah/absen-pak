<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data, form }: PageProps = $props();

	let filterProjek = $state(data.selectedProjek ? String(data.selectedProjek) : '');
	let filterTanggal = $state(data.selectedTanggal || '');
	let showManualModal = $state(false);

	let inputKaryawanId = $state('');
	let inputProjekId = $state(data.projects[0]?.id ? String(data.projects[0].id) : '');
	let inputTanggal = $state(new Date().toISOString().split('T')[0]);
	let inputHadirHarian = $state(true);
	let inputLemburJam = $state(0);
	let inputLemburHari = $state(false);
	let inputKeterangan = $state('');

	function formatRupiah(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterProjek) params.set('projek_id', filterProjek);
		if (filterTanggal) params.set('tanggal', filterTanggal);
		window.location.href = `/admin/absen?${params.toString()}`;
	}

	function resetFilter() {
		window.location.href = '/admin/absen';
	}
</script>

<div class="container absen-page">
	<div class="page-top">
		<div>
			<a href="/admin" class="back-link">← Kembali ke Dashboard</a>
			<h1>Rekap Absensi Lapangan</h1>
			<p>Verifikasi absensi mandiri dari tukang atau input manual oleh pengawas</p>
		</div>

		<div class="top-actions">
			<a href="/admin/laporan" class="btn btn-secondary">
				💰 Buka Laporan Matrix Penggajian
			</a>
			<button class="btn btn-primary" onclick={() => showManualModal = true}>
				✍️ Input Absen Manual
			</button>
		</div>
	</div>

	{#if form?.success}
		<div class="alert-success">
			<span>✅</span>
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert-error">
			<span>⚠️</span>
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Filter Bar -->
	<div class="card filter-card">
		<div class="filter-grid">
			<div class="form-group mb-0">
				<label for="filter_projek" class="form-label">Filter Proyek</label>
				<select id="filter_projek" class="select" bind:value={filterProjek} onchange={applyFilter}>
					<option value="">-- Semua Proyek --</option>
					{#each data.projects as p}
						<option value={String(p.id)}>{p.nama_projek} ({p.status})</option>
					{/each}
				</select>
			</div>

			<div class="form-group mb-0">
				<label for="filter_tanggal" class="form-label">Filter Tanggal Spesifik</label>
				<input id="filter_tanggal" type="date" class="input" bind:value={filterTanggal} onchange={applyFilter} />
			</div>

			<div class="filter-actions">
				<button class="btn btn-secondary btn-sm" onclick={resetFilter}>Reset Filter</button>
			</div>
		</div>
	</div>

	<!-- Attendance Table -->
	<div class="card table-card">
		<div class="card-header">
			<h2>Data Absensi ({data.attendances.length} Rekaman)</h2>
		</div>

		{#if data.attendances.length === 0}
			<div class="empty-state">
				<p>Tidak ada data absensi untuk filter yang dipilih.</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table class="data-table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Nama Pekerja</th>
							<th>Jabatan</th>
							<th>Proyek</th>
							<th>Harian</th>
							<th>Lembur Jam</th>
							<th>Lembur Hari</th>
							<th class="text-right">Upah Hari Ini</th>
							<th class="text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.attendances as a}
							{@const subHarian = Number(a.hadir_harian) * Number(a.snapshot_rate_harian)}
							{@const subJam = Number(a.lembur_jam) * Number(a.snapshot_rate_lembur_jam)}
							{@const subLHari = Number(a.lembur_hari) * Number(a.snapshot_rate_lembur_hari)}
							{@const totalH = subHarian + subJam + subLHari}
							<tr>
								<td>
									<strong>{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
								</td>
								<td>
									<strong>{a.nama_karyawan}</strong>
								</td>
								<td>
									<span class="badge badge-purple">{a.nama_jabatan || '-'}</span>
								</td>
								<td>{a.nama_projek}</td>
								<td>
									{#if Number(a.hadir_harian) > 0}
										<span class="badge badge-success">1 ({formatRupiah(Number(a.snapshot_rate_harian))})</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td>
									{#if Number(a.lembur_jam) > 0}
										<span class="badge badge-warning">{a.lembur_jam} Jam ({formatRupiah(Number(a.snapshot_rate_lembur_jam))})</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td>
									{#if Number(a.lembur_hari) > 0}
										<span class="badge badge-primary">1 ({formatRupiah(Number(a.snapshot_rate_lembur_hari))})</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td class="text-right font-bold">{formatRupiah(totalH)}</td>
								<td class="text-right">
									<form method="POST" action="?/hapus" style="display:inline;" onsubmit={(e) => !confirm(`Hapus catatan absen ${a.nama_karyawan} tgl ${a.tanggal}?`) && e.preventDefault()}>
										<input type="hidden" name="id" value={a.id} />
										<button type="submit" class="btn btn-sm btn-danger">Hapus</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Modal Input Absen Manual Admin -->
	{#if showManualModal}
		<div class="modal-backdrop" onclick={() => showManualModal = false}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Input Absen Mandor / Admin</h2>
					<button class="close-btn" onclick={() => showManualModal = false}>✕</button>
				</div>

				<form method="POST" action="?/inputManual" onsubmit={() => showManualModal = false}>
					<div class="form-group">
						<label for="manual_karyawan" class="form-label">Pilih Pekerja</label>
						<select id="manual_karyawan" name="karyawan_id" class="select" bind:value={inputKaryawanId} required>
							<option value="">-- Pilih Pekerja --</option>
							{#each data.employees as e}
								<option value={e.id}>{e.nama} ({e.nama_jabatan || 'Tukang'}) - {formatRupiah(e.rate_harian)}/hr</option>
							{/each}
						</select>
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="manual_projek" class="form-label">Proyek</label>
							<select id="manual_projek" name="projek_id" class="select" bind:value={inputProjekId} required>
								{#each data.projects as p}
									<option value={p.id}>{p.nama_projek}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="manual_tanggal" class="form-label">Tanggal</label>
							<input id="manual_tanggal" name="tanggal" type="date" class="input" bind:value={inputTanggal} required />
						</div>
					</div>

					<div class="options-box">
						<label class="check-item">
							<input type="checkbox" name="hadir_harian" bind:checked={inputHadirHarian} />
							<span>Hadir Normal (1 Hari Kerja Penuh)</span>
						</label>

						<div class="jam-item">
							<label for="manual_jam" class="form-label">Lembur Jam (Isi angka):</label>
							<input id="manual_jam" name="lembur_jam" type="number" class="input" bind:value={inputLemburJam} min="0" max="24" step="1" />
						</div>

						<label class="check-item">
							<input type="checkbox" name="lembur_hari" bind:checked={inputLemburHari} />
							<span>Lembur Hari Penuh (1 Hari Tambahan)</span>
						</label>
					</div>

					<div class="form-group">
						<label for="manual_ket" class="form-label">Catatan / Pekerjaan</label>
						<input id="manual_ket" name="keterangan" type="text" class="input" bind:value={inputKeterangan} placeholder="Opsional keterangan" />
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => showManualModal = false}>Batal</button>
						<button type="submit" class="btn btn-primary">Simpan Absen</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	.absen-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.top-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.back-link {
		color: var(--primary);
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		display: inline-block;
	}

	.filter-card {
		padding: 1.25rem;
	}

	.filter-grid {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.mb-0 { margin-bottom: 0 !important; }

	.filter-actions {
		margin-bottom: 2px;
	}

	.table-responsive {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th, .data-table td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border-subtle);
		text-align: left;
	}

	.data-table th {
		background: var(--bg-subtle);
		font-weight: 700;
		font-size: 0.775rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.font-bold {
		font-weight: 700;
		color: #0f172a;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 50;
	}

	.modal-card {
		background: white;
		border-radius: var(--radius-xl);
		padding: 2rem;
		width: 100%;
		max-width: 520px;
		box-shadow: var(--shadow-xl);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: var(--text-muted);
	}

	.form-grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.options-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin: 1rem 0;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.check-item input {
		width: 1.15rem;
		height: 1.15rem;
	}

	.jam-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.jam-item input {
		width: 100px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.alert-success {
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #065f46;
		padding: 0.85rem 1.25rem;
		border-radius: var(--radius-md);
		font-weight: 600;
	}

	.alert-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.85rem 1.25rem;
		border-radius: var(--radius-md);
		font-weight: 600;
	}
</style>
