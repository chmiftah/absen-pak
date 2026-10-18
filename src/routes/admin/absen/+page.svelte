<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let filterProjek = $state(data.selectedProjek ? String(data.selectedProjek) : '');
	let filterPeriode = $state(data.periode || 'minggu_ini');
	let filterStartDate = $state(data.startDateStr || '');
	let filterEndDate = $state(data.endDateStr || '');
	let showManualModal = $state(false);
	let editingAbsen = $state<any>(null);
	let isSubmitting = $state(false);

	let selectedIds = $state<number[]>([]);

	const isAllSelected = $derived(
		data.attendances.length > 0 && selectedIds.length === data.attendances.length
	);
	const isSomeSelected = $derived(
		selectedIds.length > 0 && selectedIds.length < data.attendances.length
	);

	function toggleSelectAll(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.checked) {
			selectedIds = data.attendances.map((a: any) => a.id);
		} else {
			selectedIds = [];
		}
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((item) => item !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function deselectAll() {
		selectedIds = [];
	}

	$effect(() => {
		const currentIds = new Set(data.attendances.map((a: any) => a.id));
		if (selectedIds.some((id) => !currentIds.has(id))) {
			selectedIds = selectedIds.filter((id) => currentIds.has(id));
		}
	});

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
		if (filterPeriode && filterPeriode !== 'minggu_ini') {
			params.set('periode', filterPeriode);
		}
		if (filterPeriode === 'rentang') {
			if (filterStartDate) params.set('start_date', filterStartDate);
			if (filterEndDate) params.set('end_date', filterEndDate);
		}
		const qs = params.toString();
		window.location.href = `/admin/absen${qs ? `?${qs}` : ''}`;
	}

	function selectPeriode(p: string) {
		filterPeriode = p;
		applyFilter();
	}

	function resetFilter() {
		window.location.href = '/admin/absen';
	}

	function openEditModal(a: any) {
		editingAbsen = {
			...a,
			tanggalStr: new Date(a.tanggal).toISOString().split('T')[0],
			hadirHarian: Number(a.hadir_harian) > 0,
			lemburJam: Number(a.lembur_jam || 0),
			lemburHari: Number(a.lembur_hari) > 0
		};
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
			<button type="button" class="btn btn-primary" onclick={() => showManualModal = true}>
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
		<!-- Quick Filter Chips -->
		<div class="period-chips-row">
			<span class="chips-label">Filter Waktu:</span>
			<div class="period-chips">
				<button 
					type="button" 
					class="chip {filterPeriode === 'minggu_ini' ? 'active' : ''}" 
					onclick={() => selectPeriode('minggu_ini')}
				>
					⚡ Minggu Ini (Aktif)
				</button>
				<button 
					type="button" 
					class="chip {filterPeriode === 'hari_ini' ? 'active' : ''}" 
					onclick={() => selectPeriode('hari_ini')}
				>
					Hari Ini
				</button>
				<button 
					type="button" 
					class="chip {filterPeriode === 'minggu_lalu' ? 'active' : ''}" 
					onclick={() => selectPeriode('minggu_lalu')}
				>
					Minggu Lalu
				</button>
				<button 
					type="button" 
					class="chip {filterPeriode === 'bulan_ini' ? 'active' : ''}" 
					onclick={() => selectPeriode('bulan_ini')}
				>
					Bulan Ini
				</button>
				<button 
					type="button" 
					class="chip {filterPeriode === 'rentang' ? 'active' : ''}" 
					onclick={() => { filterPeriode = 'rentang'; }}
				>
					Rentang Tanggal...
				</button>
				<button 
					type="button" 
					class="chip {filterPeriode === 'semua' ? 'active' : ''}" 
					onclick={() => selectPeriode('semua')}
				>
					Semua Waktu
				</button>
			</div>
		</div>

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
				<label for="filter_periode_select" class="form-label">Pilihan Periode</label>
				<select id="filter_periode_select" class="select" bind:value={filterPeriode} onchange={applyFilter}>
					<option value="minggu_ini">Minggu Ini (Sedang Berjalan)</option>
					<option value="hari_ini">Hari Ini</option>
					<option value="minggu_lalu">Minggu Lalu</option>
					<option value="bulan_ini">Bulan Ini</option>
					<option value="rentang">Pilih Rentang Tanggal Bebas</option>
					<option value="semua">Tampilkan Semua Waktu</option>
				</select>
			</div>

			{#if filterPeriode === 'rentang'}
				<div class="form-group mb-0">
					<label for="filter_start" class="form-label">Dari Tanggal</label>
					<input id="filter_start" type="date" class="input" bind:value={filterStartDate} onchange={applyFilter} />
				</div>
				<div class="form-group mb-0">
					<label for="filter_end" class="form-label">Sampai Tanggal</label>
					<input id="filter_end" type="date" class="input" bind:value={filterEndDate} onchange={applyFilter} />
				</div>
			{/if}

			<div class="filter-actions">
				<button type="button" class="btn btn-secondary btn-sm" onclick={resetFilter} title="Reset ke default minggu ini">
					Reset Filter
				</button>
			</div>
		</div>
	</div>

	<!-- Attendance Table -->
	<div class="card table-card">
		<div class="card-header table-header-flex">
			<div class="table-header-title">
				<h2>Data Absensi ({data.attendances.length} Rekaman)</h2>
				<span class="period-badge">📅 {data.periodeLabel}</span>
				{#if selectedIds.length > 0}
					<span class="selection-pill">{selectedIds.length} data ditandai</span>
				{/if}
			</div>

			{#if selectedIds.length > 0}
				<div class="batch-actions-wrapper">
					<button type="button" class="btn btn-secondary btn-sm" onclick={deselectAll}>
						Batal Pilih
					</button>
					<form 
						method="POST" 
						action="?/hapusBatch" 
						style="display:inline;"
						use:enhance={({ cancel }) => {
							if (!confirm(`Hapus ${selectedIds.length} data absensi yang ditandai? Tindakan ini permanen dan tidak dapat dibatalkan.`)) {
								cancel();
								return;
							}
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								await update();
								if (result.type === 'success') {
									selectedIds = [];
								}
							};
						}}
					>
						<input type="hidden" name="ids" value={selectedIds.join(',')} />
						<button type="submit" class="btn btn-danger btn-sm" disabled={isSubmitting}>
							🗑️ Hapus {selectedIds.length} Data Terpilih
						</button>
					</form>
				</div>
			{/if}
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
							<th class="check-col">
								<input 
									type="checkbox" 
									class="custom-checkbox"
									checked={isAllSelected}
									indeterminate={isSomeSelected}
									onchange={toggleSelectAll}
									title={isAllSelected ? "Batalkan pilih semua" : "Pilih semua data"}
									aria-label="Pilih semua data absensi"
								/>
							</th>
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
						{#each data.attendances as a (a.id)}
							{@const isChecked = selectedIds.includes(a.id)}
							{@const subHarian = Number(a.hadir_harian) * Number(a.snapshot_rate_harian)}
							{@const subJam = Number(a.lembur_jam) * Number(a.snapshot_rate_lembur_jam)}
							{@const subLHari = Number(a.lembur_hari) * Number(a.snapshot_rate_lembur_hari)}
							{@const totalH = subHarian + subJam + subLHari}
							<tr class:row-selected={isChecked}>
								<td class="check-col">
									<input 
										type="checkbox" 
										class="custom-checkbox"
										checked={isChecked}
										onchange={() => toggleSelect(a.id)}
										aria-label={`Pilih absensi ${a.nama_karyawan}`}
									/>
								</td>
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
								<td class="text-right actions-cell">
									<button type="button" class="btn btn-sm btn-secondary" onclick={() => openEditModal(a)}>
										✏️ Edit
									</button>
									<form 
										method="POST" 
										action="?/hapus" 
										style="display:inline;"
										use:enhance={({ cancel }) => {
											if (!confirm(`Hapus catatan absen ${a.nama_karyawan} tanggal ${new Date(a.tanggal).toISOString().split('T')[0]}?`)) {
												cancel();
												return;
											}
											return async ({ result, update }) => {
												await update();
												if (result.type === 'success') {
													selectedIds = selectedIds.filter(id => id !== a.id);
												}
											};
										}}
									>
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

	<!-- Floating Batch Action Bar (Visible when items selected) -->
	{#if selectedIds.length > 0}
		<div class="floating-batch-bar" role="toolbar" aria-label="Aksi massal absensi">
			<div class="floating-content">
				<div class="floating-info">
					<span class="floating-counter">{selectedIds.length}</span>
					<span>data ditandai</span>
				</div>
				<div class="floating-actions">
					<button type="button" class="btn btn-secondary btn-sm" onclick={deselectAll}>
						Batal
					</button>
					<form 
						method="POST" 
						action="?/hapusBatch" 
						style="display:inline;"
						use:enhance={({ cancel }) => {
							if (!confirm(`Hapus ${selectedIds.length} data absensi yang ditandai? Tindakan ini permanen dan tidak dapat dibatalkan.`)) {
								cancel();
								return;
							}
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								await update();
								if (result.type === 'success') {
									selectedIds = [];
								}
							};
						}}
					>
						<input type="hidden" name="ids" value={selectedIds.join(',')} />
						<button type="submit" class="btn btn-danger btn-sm" disabled={isSubmitting}>
							🗑️ Hapus ({selectedIds.length})
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal Input Absen Manual Admin -->
	{#if showManualModal}
		<div class="modal-backdrop" onclick={() => showManualModal = false} role="presentation">
			<div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Input Absen Mandor / Admin</h2>
					<button type="button" class="close-btn" onclick={() => showManualModal = false}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/inputManual"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								showManualModal = false;
							}
						};
					}}
				>
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
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Simpan Absen{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Edit Absen Admin -->
	{#if editingAbsen}
		<div class="modal-backdrop" onclick={() => editingAbsen = null} role="presentation">
			<div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Edit Absen: {editingAbsen.nama_karyawan}</h2>
					<button type="button" class="close-btn" onclick={() => editingAbsen = null}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/editAbsen"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								editingAbsen = null;
							}
						};
					}}
				>
					<input type="hidden" name="id" value={editingAbsen.id} />

					<div class="form-grid-2">
						<div class="form-group">
							<label for="edit_projek" class="form-label">Proyek</label>
							<select id="edit_projek" name="projek_id" class="select" bind:value={editingAbsen.projek_id} required>
								{#each data.projects as p}
									<option value={p.id}>{p.nama_projek}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="edit_tanggal" class="form-label">Tanggal</label>
							<input id="edit_tanggal" name="tanggal" type="date" class="input" bind:value={editingAbsen.tanggalStr} required />
						</div>
					</div>

					<div class="options-box">
						<label class="check-item">
							<input type="checkbox" name="hadir_harian" bind:checked={editingAbsen.hadirHarian} />
							<span>Hadir Normal (1 Hari Kerja Penuh)</span>
						</label>

						<div class="jam-item">
							<label for="edit_jam" class="form-label">Lembur Jam (Isi angka):</label>
							<input id="edit_jam" name="lembur_jam" type="number" class="input" bind:value={editingAbsen.lemburJam} min="0" max="24" step="1" />
						</div>

						<label class="check-item">
							<input type="checkbox" name="lembur_hari" bind:checked={editingAbsen.lemburHari} />
							<span>Lembur Hari Penuh (1 Hari Tambahan)</span>
						</label>
					</div>

					<div class="form-group">
						<label for="edit_ket" class="form-label">Catatan / Pekerjaan</label>
						<input id="edit_ket" name="keterangan" type="text" class="input" bind:value={editingAbsen.keterangan} placeholder="Opsional keterangan" />
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => editingAbsen = null}>Batal</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Simpan Perubahan Absen{/if}
						</button>
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

	.period-chips-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.15rem;
		flex-wrap: wrap;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-subtle);
	}

	.chips-label {
		font-size: 0.775rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.period-chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.chip {
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		font-size: 0.8rem;
		font-weight: 500;
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.chip:hover {
		border-color: var(--primary);
		color: var(--primary);
	}

	.chip.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
		font-weight: 600;
		box-shadow: var(--shadow-sm);
	}

	.period-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.775rem;
		font-weight: 600;
		color: var(--primary);
		background: rgba(37, 99, 235, 0.08);
		border: 1px solid rgba(37, 99, 235, 0.2);
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
	}

	.filter-grid {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.filter-grid .form-group {
		flex: 1;
		min-width: 200px;
	}

	.mb-0 {
		margin-bottom: 0 !important;
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

	.table-header-flex {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.table-header-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.selection-pill {
		background: var(--primary-light);
		color: var(--primary-text);
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid #bfdbfe;
		animation: fadeIn 0.2s ease-in-out;
	}

	.batch-actions-wrapper {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		animation: fadeIn 0.2s ease-in-out;
	}

	.check-col {
		width: 44px;
		text-align: center !important;
		padding-left: 0.75rem !important;
		padding-right: 0.5rem !important;
	}

	.custom-checkbox {
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 4px;
		cursor: pointer;
		accent-color: var(--primary);
		vertical-align: middle;
		transition: transform 0.12s ease;
	}

	.custom-checkbox:hover {
		transform: scale(1.1);
	}

	.row-selected {
		background-color: #f0f7ff !important;
	}

	.row-selected:hover {
		background-color: #e0f0fe !important;
	}

	.floating-batch-bar {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		max-width: calc(100vw - 2rem);
	}

	.floating-content {
		background: #0f172a;
		color: white;
		border-radius: 9999px;
		padding: 0.5rem 0.75rem 0.5rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.floating-info {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.floating-counter {
		background: var(--primary);
		color: white;
		font-weight: 700;
		padding: 0.15rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.8rem;
	}

	.floating-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translate(-50%, 15px); }
		to { opacity: 1; transform: translate(-50%, 0); }
	}

	.actions-cell {
		display: flex;
		gap: 0.4rem;
		justify-content: flex-end;
		align-items: center;
	}

	.options-box {
		background: var(--bg-subtle);
		padding: 1rem;
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-bottom: 1.25rem;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.jam-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.jam-item .input {
		width: 100px;
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
