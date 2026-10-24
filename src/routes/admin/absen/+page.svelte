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
	let editingUpah = $state<any>(null);
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
	let inputHadirHarian = $state('1');
	let inputLemburJam = $state(0);
	let inputLemburHari = $state(false);
	let inputKeterangan = $state('');

	let selectedWorker = $derived(
		data.employees.find((e: any) => String(e.id) === String(inputKaryawanId))
	);

	$effect(() => {
		if (selectedWorker?.projek_id) {
			inputProjekId = String(selectedWorker.projek_id);
		}
	});

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
			hadirHarian: String(Number(a.hadir_harian || 0)),
			lemburJam: Number(a.lembur_jam || 0),
			lemburHari: Number(a.lembur_hari) > 0,
			snapshotRateHarian: Number(a.snapshot_rate_harian || 0),
			snapshotRateLemburJam: Number(a.snapshot_rate_lembur_jam || 0),
			snapshotRateLemburHari: Number(a.snapshot_rate_lembur_hari || 0),
			updateMasterRate: false
		};
	}

	function openEditUpahModal(a: any) {
		editingUpah = {
			id: a.id,
			karyawanId: a.karyawan_id,
			nama_karyawan: a.nama_karyawan,
			nama_projek: a.nama_projek,
			nama_jabatan: a.nama_jabatan,
			tanggal: a.tanggal,
			tanggalStr: new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
			hadirHarian: Number(a.hadir_harian || 0),
			lemburJam: Number(a.lembur_jam || 0),
			lemburHari: Number(a.lembur_hari || 0),
			snapshotRateHarian: Number(a.snapshot_rate_harian || 0),
			snapshotRateLemburJam: Number(a.snapshot_rate_lembur_jam || 0),
			snapshotRateLemburHari: Number(a.snapshot_rate_lembur_hari || 0),
			updateMasterRate: false
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
									{#if Number(a.hadir_harian) === 0.5}
										<span class="badge badge-info">1/2 ({formatRupiah(subHarian)})</span>
									{:else if Number(a.hadir_harian) > 0}
										<span class="badge badge-success">1 ({formatRupiah(subHarian)})</span>
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
								<td class="text-right font-bold total-gaji-td">
									<button 
										type="button" 
										class="btn-quick-upah" 
										onclick={() => openEditUpahModal(a)} 
										title="Klik untuk langsung edit upah hari ini"
									>
										<span>{formatRupiah(totalH)}</span>
										<span class="btn-quick-icon" aria-hidden="true">✏️</span>
									</button>
								</td>
								<td class="text-right actions-cell">
									<button type="button" class="btn btn-sm btn-edit-upah" onclick={() => openEditUpahModal(a)} title="Edit tarif upah hari ini">
										💰 Upah
									</button>
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
								<option value={e.id}>
									{e.nama} ({e.nama_jabatan || 'Tukang'}) • Proyek: {e.nama_projek || 'Belum Diatur'}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="manual_projek" class="form-label">
								Proyek
								{#if selectedWorker?.nama_projek}
									<span class="badge-lock-inline">🔒 Sesuai Master: {selectedWorker.nama_projek}</span>
								{/if}
							</label>
							<select id="manual_projek" name="projek_id" class="select" bind:value={inputProjekId} required>
								{#each data.projects as p}
									<option 
										value={p.id}
										disabled={selectedWorker?.projek_id && Number(p.id) !== Number(selectedWorker.projek_id)}
									>
										{p.nama_projek} {selectedWorker?.projek_id && Number(p.id) === Number(selectedWorker.projek_id) ? '(Sesuai Data Master)' : ''}
									</option>
								{/each}
							</select>
							{#if selectedWorker && !selectedWorker.projek_id}
								<small class="hint-warn">⚠️ Pekerja ini belum memiliki penugasan proyek di data master.</small>
							{/if}
						</div>

						<div class="form-group">
							<label for="manual_tanggal" class="form-label">Tanggal</label>
							<input id="manual_tanggal" name="tanggal" type="date" class="input" bind:value={inputTanggal} required />
						</div>
					</div>

					<div class="form-group">
						<label class="form-label">Kehadiran Harian</label>
						<div class="radio-card-group">
							<label class="radio-option {inputHadirHarian === '1' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="1" bind:group={inputHadirHarian} />
								<span class="ro-content">
									<strong>☀️ Hadir Penuh</strong>
									<small>1 Hari Kerja</small>
								</span>
							</label>
							<label class="radio-option {inputHadirHarian === '0.5' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="0.5" bind:group={inputHadirHarian} />
								<span class="ro-content">
									<strong>🌤️ Setengah Hari</strong>
									<small>1/2 Hari (50%)</small>
								</span>
							</label>
							<label class="radio-option {inputHadirHarian === '0' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="0" bind:group={inputHadirHarian} />
								<span class="ro-content">
									<strong>🚫 Tidak Hadir</strong>
									<small>0 Hari Harian</small>
								</span>
							</label>
						</div>
					</div>

					<div class="options-box">
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
							<label for="edit_projek" class="form-label">
								Proyek
								{#if editingAbsen.master_projek_id}
									<span class="badge-lock-inline">🔒 Sesuai Master Data</span>
								{/if}
							</label>
							<select id="edit_projek" name="projek_id" class="select" bind:value={editingAbsen.projek_id} required>
								{#each data.projects as p}
									<option 
										value={p.id}
										disabled={editingAbsen.master_projek_id && Number(p.id) !== Number(editingAbsen.master_projek_id)}
									>
										{p.nama_projek} {editingAbsen.master_projek_id && Number(p.id) === Number(editingAbsen.master_projek_id) ? '(Sesuai Data Master)' : ''}
									</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="edit_tanggal" class="form-label">Tanggal</label>
							<input id="edit_tanggal" name="tanggal" type="date" class="input" bind:value={editingAbsen.tanggalStr} required />
						</div>
					</div>

					<div class="form-group">
						<label class="form-label">Kehadiran Harian</label>
						<div class="radio-card-group">
							<label class="radio-option {editingAbsen.hadirHarian === '1' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="1" bind:group={editingAbsen.hadirHarian} />
								<span class="ro-content">
									<strong>☀️ Hadir Penuh</strong>
									<small>1 Hari Kerja</small>
								</span>
							</label>
							<label class="radio-option {editingAbsen.hadirHarian === '0.5' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="0.5" bind:group={editingAbsen.hadirHarian} />
								<span class="ro-content">
									<strong>🌤️ Setengah Hari</strong>
									<small>1/2 Hari (50%)</small>
								</span>
							</label>
							<label class="radio-option {editingAbsen.hadirHarian === '0' ? 'active' : ''}">
								<input type="radio" name="hadir_harian" value="0" bind:group={editingAbsen.hadirHarian} />
								<span class="ro-content">
									<strong>🚫 Tidak Hadir</strong>
									<small>0 Hari Harian</small>
								</span>
							</label>
						</div>
					</div>

					<div class="options-box">
						<div class="jam-item">
							<label for="edit_jam" class="form-label">Lembur Jam (Isi angka):</label>
							<input id="edit_jam" name="lembur_jam" type="number" class="input" bind:value={editingAbsen.lemburJam} min="0" max="24" step="1" />
						</div>

						<label class="check-item">
							<input type="checkbox" name="lembur_hari" bind:checked={editingAbsen.lemburHari} />
							<span>Lembur Hari Penuh (1 Hari Tambahan)</span>
						</label>
					</div>

					<div class="rate-custom-box">
						<div class="rcb-title">
							<span>💰 Tarif Upah Hari Ini (Snapshot Rate)</span>
						</div>
						<div class="form-grid-3">
							<div class="form-group">
								<label for="edit_rate_harian" class="form-label">Upah Harian (Rp)</label>
								<input 
									id="edit_rate_harian" 
									name="snapshot_rate_harian" 
									type="number" 
									class="input" 
									bind:value={editingAbsen.snapshotRateHarian} 
									min="0" 
									step="1000" 
									required 
								/>
							</div>
							<div class="form-group">
								<label for="edit_rate_lembur_jam" class="form-label">Lembur / Jam (Rp)</label>
								<input 
									id="edit_rate_lembur_jam" 
									name="snapshot_rate_lembur_jam" 
									type="number" 
									class="input" 
									bind:value={editingAbsen.snapshotRateLemburJam} 
									min="0" 
									step="1000" 
								/>
							</div>
							<div class="form-group">
								<label for="edit_rate_lembur_hari" class="form-label">Lembur / Hari (Rp)</label>
								<input 
									id="edit_rate_lembur_hari" 
									name="snapshot_rate_lembur_hari" 
									type="number" 
									class="input" 
									bind:value={editingAbsen.snapshotRateLemburHari} 
									min="0" 
									step="1000" 
								/>
							</div>
						</div>
						<label class="check-item-sub">
							<input type="checkbox" name="update_master_rate" bind:checked={editingAbsen.updateMasterRate} />
							<span>Terapkan juga ke Master Data Pekerja (untuk absensi ke depan)</span>
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

	<!-- MODAL KHUSUS: EDIT UPAH HARI INI LANGSUNG -->
	{#if editingUpah}
		{@const subHarian = (editingUpah.hadirHarian || 0) * Number(editingUpah.snapshotRateHarian || 0)}
		{@const subJam = (editingUpah.lemburJam || 0) * Number(editingUpah.snapshotRateLemburJam || 0)}
		{@const subLHari = (editingUpah.lemburHari || 0) * Number(editingUpah.snapshotRateLemburHari || 0)}
		{@const totalPreview = subHarian + subJam + subLHari}
		<div class="modal-backdrop" onclick={() => editingUpah = null} role="presentation">
			<div class="modal-card modal-upah-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
				<div class="modal-header">
					<div>
						<h2>💰 Edit Upah Hari Ini</h2>
						<p class="modal-sub">
							<strong>{editingUpah.nama_karyawan}</strong> ({editingUpah.nama_jabatan || 'Tukang'}) • {editingUpah.tanggalStr}
						</p>
					</div>
					<button type="button" class="close-btn" onclick={() => editingUpah = null} aria-label="Tutup">✕</button>
				</div>

				<form 
					method="POST" 
					action="?/updateUpahHariIni"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
							editingUpah = null;
						};
					}}
				>
					<input type="hidden" name="id" value={editingUpah.id} />

					<!-- Status Rekap Hari Ini -->
					<div class="upah-work-status-banner">
						<div class="uws-item">
							<span class="uws-label">Status Presensi:</span>
							<strong class="uws-val">
								{#if editingUpah.hadirHarian === 0.5}
									<span class="badge badge-info">🌤️ 1/2 Hari (Setengah Hari)</span>
								{:else if editingUpah.hadirHarian === 1}
									<span class="badge badge-success">☀️ 1 Hari (Hadir Penuh)</span>
								{:else}
									<span class="text-muted">🚫 Tidak Hadir</span>
								{/if}
							</strong>
						</div>
						<div class="uws-item">
							<span class="uws-label">Lembur:</span>
							<strong class="uws-val">
								{#if editingUpah.lemburJam > 0 && editingUpah.lemburHari > 0}
									<span class="badge badge-warning">⏱️ {editingUpah.lemburJam} Jam</span> + <span class="badge badge-primary">🌟 1 Hari</span>
								{:else if editingUpah.lemburJam > 0}
									<span class="badge badge-warning">⏱️ {editingUpah.lemburJam} Jam</span>
								{:else if editingUpah.lemburHari > 0}
									<span class="badge badge-primary">🌟 1 Hari Lembur</span>
								{:else}
									<span class="text-muted">-</span>
								{/if}
							</strong>
						</div>
						<div class="uws-item">
							<span class="uws-label">Lokasi Proyek:</span>
							<strong class="uws-val">{editingUpah.nama_projek}</strong>
						</div>
					</div>

					<div class="upah-inputs-group">
						<div class="form-group">
							<label for="u_rate_harian" class="form-label font-bold">
								Tarif Upah Harian Hari Ini (Rp):
							</label>
							<div class="input-with-sub">
								<input 
									id="u_rate_harian" 
									name="snapshot_rate_harian" 
									type="number" 
									class="input input-rate-primary" 
									bind:value={editingUpah.snapshotRateHarian} 
									min="0" 
									step="1000" 
									required 
								/>
								<div class="input-calc-helper">
									Hitungan harian: <strong>{editingUpah.hadirHarian === 0.5 ? '1/2' : editingUpah.hadirHarian} Hari</strong> × {formatRupiah(editingUpah.snapshotRateHarian)} = 
									<span class="calc-res">{formatRupiah(subHarian)}</span>
								</div>
							</div>
						</div>

						<div class="form-grid-2">
							<div class="form-group">
								<label for="u_rate_lembur_jam" class="form-label">Rate Lembur / Jam (Rp):</label>
								<div class="input-with-sub">
									<input 
										id="u_rate_lembur_jam" 
										name="snapshot_rate_lembur_jam" 
										type="number" 
										class="input" 
										bind:value={editingUpah.snapshotRateLemburJam} 
										min="0" 
										step="1000" 
									/>
									<div class="input-calc-helper">
										{editingUpah.lemburJam} Jam = <strong>{formatRupiah(subJam)}</strong>
									</div>
								</div>
							</div>

							<div class="form-group">
								<label for="u_rate_lembur_hari" class="form-label">Rate Lembur / Hari (Rp):</label>
								<div class="input-with-sub">
									<input 
										id="u_rate_lembur_hari" 
										name="snapshot_rate_lembur_hari" 
										type="number" 
										class="input" 
										bind:value={editingUpah.snapshotRateLemburHari} 
										min="0" 
										step="1000" 
									/>
									<div class="input-calc-helper">
										{editingUpah.lemburHari} Hari = <strong>{formatRupiah(subLHari)}</strong>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Total Gaji Live Summary Card -->
					<div class="total-upah-preview-card">
						<div class="tupc-header">
							<span class="tupc-label">TOTAL UPAH TANGGAL INI:</span>
							<strong class="tupc-amount">{formatRupiah(totalPreview)}</strong>
						</div>
						<div class="tupc-breakdown">
							Subtotal: Harian ({formatRupiah(subHarian)}) + Lembur Jam ({formatRupiah(subJam)}) + Lembur Hari ({formatRupiah(subLHari)})
						</div>
					</div>

					<!-- Option to update master -->
					<div class="master-sync-option">
						<label class="check-item-master">
							<input type="checkbox" name="update_master_rate" bind:checked={editingUpah.updateMasterRate} />
							<span class="cim-text">
								<strong>Perbarui juga ke Master Data Pekerja</strong>
								<small>Centang jika ingin upah ini otomatis menjadi acuan untuk absensi berikutnya.</small>
							</span>
						</label>
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => editingUpah = null}>Batal</button>
						<button type="submit" class="btn btn-primary btn-save-upah" disabled={isSubmitting}>
							{#if isSubmitting}⏳ Menyimpan...{:else}💾 Simpan Upah Hari Ini{/if}
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
		background: rgba(15, 23, 42, 0.65);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		z-index: 2000;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.modal-card {
		background: white;
		border-radius: var(--radius-xl);
		padding: 1.75rem 1.75rem 1rem 1.75rem;
		width: 100%;
		max-width: 520px;
		max-height: calc(100dvh - 2.5rem);
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		position: relative;
		z-index: 2001;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: -1.75rem;
		background: white;
		z-index: 10;
		margin-top: -1.75rem;
		padding-top: 1.75rem;
		flex-shrink: 0;
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
		margin-top: 1.25rem;
		position: sticky;
		bottom: -1rem;
		background: white;
		z-index: 10;
		padding-top: 0.85rem;
		padding-bottom: 1rem;
		border-top: 1px solid var(--border-subtle);
		box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.05);
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

	.badge-lock-inline {
		display: inline-flex;
		align-items: center;
		background: #e0f2fe;
		color: #0369a1;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		margin-left: 0.35rem;
		border: 1px solid #bae6fd;
		vertical-align: middle;
	}

	.hint-warn {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.75rem;
		color: #b91c1c;
		font-weight: 600;
	}

	.radio-card-group {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-top: 0.35rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.75rem;
		border: 1.5px solid var(--border-subtle);
		border-radius: var(--radius-md);
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.radio-option:hover {
		border-color: #94a3b8;
		background: #f8fafc;
	}

	.radio-option.active {
		border-color: var(--primary);
		background: #eff6ff;
	}

	.radio-option input[type="radio"] {
		accent-color: var(--primary);
	}

	.ro-content {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}

	.ro-content strong {
		font-size: 0.82rem;
		color: var(--text-main);
	}

	.ro-content small {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	@media (max-width: 640px) {
		.modal-backdrop {
			padding: 0;
			align-items: flex-end;
			overflow: hidden;
		}

		.modal-card {
			max-width: 100%;
			width: 100%;
			border-radius: 1.5rem 1.5rem 0 0;
			max-height: calc(100dvh - 1.5rem);
			max-height: calc(100vh - 1.5rem);
			padding: 1.25rem 1.25rem 0.5rem 1.25rem;
			animation: slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.modal-header {
			top: -1.25rem;
			margin-top: -1.25rem;
			padding-top: 1.25rem;
		}

		.modal-actions {
			bottom: -0.5rem;
			padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
			margin-left: -1.25rem;
			margin-right: -1.25rem;
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}

		.modal-actions .btn {
			flex: 1;
			min-height: 44px;
		}

		.radio-card-group {
			grid-template-columns: 1fr;
		}
		.form-grid-3 {
			grid-template-columns: 1fr;
		}
		.form-grid-2 {
			grid-template-columns: 1fr;
		}
	}

	@keyframes slideUpModal {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	/* Quick Upah Edit Trigger in Table */
	.total-gaji-td {
		position: relative;
	}

	.btn-quick-upah {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.35rem;
		background: transparent;
		border: 1px dashed transparent;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 700;
		color: #0f172a;
		transition: all 0.15s ease;
	}

	.btn-quick-upah:hover {
		background: #f0fdf4;
		border-color: #86efac;
		color: #15803d;
	}

	.btn-quick-icon {
		font-size: 0.75rem;
		opacity: 0.4;
		transition: opacity 0.15s ease, transform 0.15s ease;
	}

	.btn-quick-upah:hover .btn-quick-icon {
		opacity: 1;
		transform: scale(1.15);
	}

	.btn-edit-upah {
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #bbf7d0;
		font-weight: 600;
	}

	.btn-edit-upah:hover {
		background: #dcfce7;
		border-color: #86efac;
		color: #14532d;
	}

	/* Modal Upah Styles */
	.modal-upah-card {
		max-width: 540px;
	}

	.modal-sub {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-top: 0.2rem;
	}

	.upah-work-status-banner {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.uws-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.825rem;
	}

	.uws-label {
		color: var(--text-muted);
		font-weight: 500;
	}

	.uws-val {
		color: var(--text-main);
	}

	.upah-inputs-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.input-rate-primary {
		font-size: 1.1rem;
		font-weight: 700;
		color: #0f172a;
		border: 1.5px solid #cbd5e1;
	}

	.input-rate-primary:focus {
		border-color: var(--primary);
	}

	.input-with-sub {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.input-calc-helper {
		font-size: 0.75rem;
		color: #64748b;
	}

	.input-calc-helper .calc-res {
		color: #059669;
		font-weight: 700;
	}

	.total-upah-preview-card {
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
		border: 1.5px solid #86efac;
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
		box-shadow: 0 2px 4px rgba(22, 101, 52, 0.05);
	}

	.tupc-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.35rem;
	}

	.tupc-label {
		font-size: 0.8rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		color: #166534;
	}

	.tupc-amount {
		font-size: 1.35rem;
		font-weight: 900;
		color: #15803d;
	}

	.tupc-breakdown {
		font-size: 0.75rem;
		color: #166534;
		opacity: 0.85;
	}

	.master-sync-option {
		background: #f8fafc;
		border: 1px dashed #cbd5e1;
		border-radius: var(--radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
	}

	.check-item-master {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.check-item-master input[type="checkbox"] {
		margin-top: 0.2rem;
		accent-color: var(--primary);
	}

	.cim-text {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}

	.cim-text strong {
		font-size: 0.825rem;
		color: #1e293b;
	}

	.cim-text small {
		font-size: 0.72rem;
		color: #64748b;
	}

	.btn-save-upah {
		background: #16a34a;
		border-color: #15803d;
	}

	.btn-save-upah:hover {
		background: #15803d;
	}

	/* Inside General Edit Absen Modal */
	.rate-custom-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: 0.85rem 1rem;
		margin-bottom: 1.25rem;
	}

	.rcb-title {
		font-size: 0.825rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.75rem;
	}

	.form-grid-3 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.check-item-sub {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #475569;
		margin-top: 0.5rem;
		cursor: pointer;
	}
</style>
