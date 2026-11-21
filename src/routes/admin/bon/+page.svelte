<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import { formatIndoDate } from '$lib/dateUtils';

	let { data, form }: PageProps = $props();

	// Modal States
	let showAddModal = $state(false);
	let editingBon = $state<any>(null);
	let deletingBon = $state<any>(null);
	let isSubmitting = $state(false);

	// Helpers
	function formatRupiah(num: number | null | undefined): string {
		return new Intl.NumberFormat('id-ID').format(Number(num || 0));
	}

	function getCurrentTimeStr(): string {
		const now = new Date();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	}

	// Form State for Add
	let formProjekId = $state<string>(data.projects[0]?.id ? String(data.projects[0].id) : '');
	let formKaryawanId = $state<string>('');
	let formTanggal = $state<string>(data.todayStr);
	let formJam = $state<string>(getCurrentTimeStr());
	let formNominal = $state<number>(50000);
	let formKeterangan = $state<string>('');

	// When project changes in the form, optionally update employee selection
	function onFormProjekChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		formProjekId = target.value;
		// If current employee is not in this project, keep or reset
	}

	// Filtered employees for form dropdown (grouped by project or prioritized)
	let formEmployees = $derived.by(() => {
		if (!formProjekId) return data.employees;
		const projIdNum = Number(formProjekId);
		return [...data.employees].sort((a, b) => {
			const aMatch = Number(a.projek_id) === projIdNum ? 0 : 1;
			const bMatch = Number(b.projek_id) === projIdNum ? 0 : 1;
			if (aMatch !== bMatch) return aMatch - bMatch;
			return a.nama.localeCompare(b.nama);
		});
	});

	// Currently selected employee's existing total bon
	let currentKaryawanTotalBon = $derived.by(() => {
		if (!formKaryawanId) return 0;
		return data.totalBonMap[Number(formKaryawanId)] || 0;
	});

	// Quick presets
	function setNominal(val: number) {
		formNominal = val;
	}

	function addNominal(val: number) {
		formNominal = (formNominal || 0) + val;
	}

	function setTimePreset(timeStr: string) {
		if (timeStr === 'now') {
			formJam = getCurrentTimeStr();
		} else {
			formJam = timeStr;
		}
	}

	function openAddModal(prefilledKaryawanId?: number, prefilledProjekId?: number) {
		if (prefilledKaryawanId) {
			formKaryawanId = String(prefilledKaryawanId);
		} else if (data.employees[0]?.id && !formKaryawanId) {
			formKaryawanId = String(data.employees[0].id);
		}

		if (prefilledProjekId) {
			formProjekId = String(prefilledProjekId);
		} else if (!formProjekId && data.projects[0]?.id) {
			formProjekId = String(data.projects[0].id);
		}

		formTanggal = data.todayStr;
		formJam = getCurrentTimeStr();
		formNominal = 50000;
		formKeterangan = '';
		showAddModal = true;
	}

	function openEditModal(bon: any) {
		editingBon = {
			...bon,
			projek_id: String(bon.projek_id),
			karyawan_id: String(bon.karyawan_id),
			tanggal: typeof bon.tanggal === 'string' ? bon.tanggal : bon.tanggal.toISOString().split('T')[0],
			jam: bon.jam || '12:00',
			nominal: Number(bon.nominal),
			keterangan: bon.keterangan || ''
		};
	}

	// Filter state on page
	let filterProjek = $state<string>(data.filters.projekId ? String(data.filters.projekId) : 'all');
	let filterKaryawan = $state<string>(data.filters.karyawanId ? String(data.filters.karyawanId) : 'all');
	let filterPeriode = $state<string>(data.filters.periode || 'semua');
	let filterStartDate = $state<string>(data.filters.startDateStr || '');
	let filterEndDate = $state<string>(data.filters.endDateStr || '');
	let filterSearch = $state<string>(data.filters.q || '');

	// Look up active selected user if filtered
	let activeFilteredUser = $derived.by(() => {
		if (!data.filters.karyawanId) return null;
		return data.employees.find(e => e.id === data.filters.karyawanId) || null;
	});

	// Selected user total bon
	let activeFilteredUserTotalBon = $derived.by(() => {
		if (!data.filters.karyawanId) return 0;
		return data.totalBonMap[data.filters.karyawanId] || 0;
	});
</script>

<svelte:head>
	<title>Pencatatan Bon / Kasbon Karyawan - AbsenPak</title>
</svelte:head>

<div class="container bon-page">
	<!-- Page Header -->
	<div class="page-top">
		<div>
			<a href="/admin" class="back-link">← Kembali ke Dashboard</a>
			<h1>Pencatatan Bon Karyawan</h1>
			<p>Kelola pinjaman/kasbon pekerja harian per proyek dengan rekap akumulasi otomatis</p>
		</div>

		<div class="top-actions">
			<button type="button" class="btn btn-primary" onclick={() => openAddModal()}>
				➕ Catat Bon Baru
			</button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if form?.success}
		<div class="alert alert-success">
			<span class="alert-icon">✅</span>
			<div>
				<strong>Berhasil!</strong>
				<p>{form.message}</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-danger">
			<span class="alert-icon">⚠️</span>
			<div>
				<strong>Gagal Memproses Data</strong>
				<p>{form.error}</p>
			</div>
		</div>
	{/if}

	<!-- Highlight User Total Bon if user filter is active -->
	{#if activeFilteredUser}
		<div class="user-focus-banner">
			<div class="ufb-left">
				<div class="ufb-avatar">{activeFilteredUser.nama.slice(0, 2).toUpperCase()}</div>
				<div class="ufb-info">
					<div class="ufb-label">Filter Karyawan Terpilih:</div>
					<h2 class="ufb-name">{activeFilteredUser.nama}</h2>
					<span class="ufb-role">{activeFilteredUser.nama_jabatan || 'Pekerja'} • {activeFilteredUser.nama_projek || 'Umum'}</span>
				</div>
			</div>
			<div class="ufb-right">
				<div class="ufb-stat-title">TOTAL KASBON PEKERJA INI:</div>
				<div class="ufb-stat-val">Rp {formatRupiah(activeFilteredUserTotalBon)}</div>
				<div class="ufb-stat-note">Akumulasi seluruh catatan bon aktif di sistem</div>
			</div>
		</div>
	{/if}

	<!-- Stat Cards -->
	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-icon-box bg-blue">💵</div>
			<div class="stat-meta">
				<span class="stat-title">Total Bon Tampil</span>
				<div class="stat-value text-primary">Rp {formatRupiah(data.totalNominalView)}</div>
				<span class="stat-desc">{data.bonList.length} transaksi pada filter aktif</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon-box bg-amber">👷</div>
			<div class="stat-meta">
				<span class="stat-title">Pekerja Memiliki Bon</span>
				<div class="stat-value">{data.userBonTotals.length} Orang</div>
				<span class="stat-desc">Dari total {data.employees.length} pekerja aktif</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon-box bg-green">📊</div>
			<div class="stat-meta">
				<span class="stat-title">Total Keseluruhan Bon</span>
				<div class="stat-value text-emerald">Rp {formatRupiah(data.overallStat.totalNominal)}</div>
				<span class="stat-desc">{data.overallStat.totalTransaksi} transaksi di semua proyek</span>
			</div>
		</div>

		<div class="stat-card quick-record-card">
			<div class="qrc-content">
				<span class="qrc-title">Ada pekerja ambil bon hari ini?</span>
				<button type="button" class="btn btn-sm btn-primary" onclick={() => openAddModal()}>
					⚡ Input Bon Cepat
				</button>
			</div>
		</div>
	</div>

	<!-- Filter & Search Toolbar -->
	<div class="card filter-card">
		<form method="GET" class="filter-form">
			<div class="filter-grid">
				<!-- Proyek -->
				<div class="filter-field">
					<label for="f-projek" class="filter-label">Proyek</label>
					<select id="f-projek" name="projek_id" bind:value={filterProjek} class="input select-input">
						<option value="all">Semua Proyek ({data.projects.length})</option>
						{#each data.projects as p}
							<option value={String(p.id)}>{p.nama_projek} ({p.status})</option>
						{/each}
					</select>
				</div>

				<!-- Karyawan -->
				<div class="filter-field">
					<label for="f-karyawan" class="filter-label">Karyawan</label>
					<select id="f-karyawan" name="karyawan_id" bind:value={filterKaryawan} class="input select-input">
						<option value="all">Semua Karyawan ({data.employees.length})</option>
						{#each data.employees as e}
							<option value={String(e.id)}>
								{e.nama} - {e.nama_jabatan || 'Pekerja'} {data.totalBonMap[e.id] ? `(Bon: Rp ${formatRupiah(data.totalBonMap[e.id])})` : ''}
							</option>
						{/each}
					</select>
				</div>

				<!-- Periode -->
				<div class="filter-field">
					<label for="f-periode" class="filter-label">Periode</label>
					<select id="f-periode" name="periode" bind:value={filterPeriode} class="input select-input">
						<option value="semua">Semua Waktu</option>
						<option value="hari_ini">Hari Ini</option>
						<option value="minggu_ini">Minggu Ini (Minggu - Sabtu)</option>
						<option value="bulan_ini">Bulan Ini</option>
						<option value="custom">Rentang Tanggal Khusus</option>
					</select>
				</div>

				<!-- Custom Date (if selected) -->
				{#if filterPeriode === 'custom'}
					<div class="filter-field">
						<label for="f-start" class="filter-label">Dari Tanggal</label>
						<input id="f-start" type="date" name="start_date" bind:value={filterStartDate} class="input" />
					</div>
					<div class="filter-field">
						<label for="f-end" class="filter-label">Sampai Tanggal</label>
						<input id="f-end" type="date" name="end_date" bind:value={filterEndDate} class="input" />
					</div>
				{/if}

				<!-- Search Input -->
				<div class="filter-field search-field">
					<label for="f-search" class="filter-label">Cari Catatan</label>
					<input 
						id="f-search" 
						type="text" 
						name="q" 
						bind:value={filterSearch} 
						placeholder="Cari nama karyawan / keterangan..." 
						class="input"
					/>
				</div>
			</div>

			<div class="filter-actions">
				<button type="submit" class="btn btn-primary btn-sm">
					🔍 Terapkan Filter
				</button>
				<a href="/admin/bon" class="btn btn-secondary btn-sm">
					🔄 Reset
				</a>
			</div>
		</form>
	</div>

	<!-- TABEL REKAP TOTAL BON PER KARYAWAN -->
	<div class="card user-summary-section">
		<div class="section-header">
			<div>
				<h2>📊 Rekap Total Kasbon per Karyawan</h2>
				<p>Akumulasi total pinjaman/bon per pekerja {data.filters.projekId ? 'pada proyek ini' : 'di semua proyek'}</p>
			</div>
			<span class="badge badge-primary">{data.userBonTotals.length} Pekerja Memiliki Bon</span>
		</div>

		{#if data.userBonTotals.length === 0}
			<div class="empty-rekap">
				<span>👍 Belum ada pekerja yang memiliki catatan kasbon.</span>
			</div>
		{:else}
			<div class="user-cards-grid">
				{#each data.userBonTotals as ub}
					<div class="user-bon-card {data.filters.karyawanId === ub.karyawan_id ? 'active-filter-card' : ''}">
						<div class="ubc-header">
							<div class="ubc-avatar">{ub.nama_karyawan.slice(0, 2).toUpperCase()}</div>
							<div class="ubc-meta">
								<h3 class="ubc-name">{ub.nama_karyawan}</h3>
								<span class="ubc-sub">{ub.nama_jabatan || 'Pekerja'} • {ub.default_projek_nama || 'Umum'}</span>
							</div>
						</div>

						<div class="ubc-body">
							<div class="ubc-row">
								<span class="ubc-label">Jumlah Bon:</span>
								<strong class="ubc-count">{ub.jumlah_transaksi}× Ambil</strong>
							</div>
							<div class="ubc-row total-row">
								<span class="ubc-label">Total Kasbon:</span>
								<strong class="ubc-amount">Rp {formatRupiah(ub.total_bon)}</strong>
							</div>
							{#if ub.tanggal_terakhir}
								<div class="ubc-row last-date-row">
									<span class="ubc-label">Terakhir:</span>
									<span class="ubc-date">{formatIndoDate(ub.tanggal_terakhir)}</span>
								</div>
							{/if}
						</div>

						<div class="ubc-footer">
							<a 
								href="/admin/bon?karyawan_id={ub.karyawan_id}&projek_id={data.filters.projekId || 'all'}&periode=semua" 
								class="btn btn-secondary btn-sm btn-full"
							>
								👁️ Lihat Rincian
							</a>
							<button 
								type="button" 
								class="btn btn-primary btn-sm btn-full"
								onclick={() => openAddModal(ub.karyawan_id, ub.default_projek_id)}
							>
								➕ Tambah Bon
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- TABEL DAFTAR RIWAYAT TRANSAKSI BON -->
	<div class="card history-section">
		<div class="section-header">
			<div>
				<h2>🧾 Rincian Transaksi Pengambilan Bon</h2>
				<p>Daftar riwayat pengambilan uang muka/kasbon lengkap dengan jam dan tanggal</p>
			</div>
			<div class="section-right">
				<span class="badge badge-neutral">{data.bonList.length} Catatan Ditemukan</span>
			</div>
		</div>

		{#if data.bonList.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🧾</div>
				<h3>Belum Ada Data Bon</h3>
				<p>Tidak ada catatan bon yang sesuai dengan kriteria filter saat ini.</p>
				<button type="button" class="btn btn-primary mt-2" onclick={() => openAddModal()}>
					➕ Catat Bon Sekarang
				</button>
			</div>
		{:else}
			<div class="table-responsive">
				<table class="data-table">
					<thead>
						<tr>
							<th class="text-center" style="width: 50px;">No</th>
							<th style="width: 140px;">Tanggal</th>
							<th style="width: 90px;">Jam</th>
							<th>Karyawan</th>
							<th>Proyek</th>
							<th class="text-right" style="width: 140px;">Nominal Bon</th>
							<th>Keterangan</th>
							<th style="width: 120px;">Dicatat Oleh</th>
							<th class="text-center" style="width: 110px;">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.bonList as item, idx}
							<tr>
								<td class="text-center text-muted">{idx + 1}</td>
								<td>
									<div class="date-cell">
										<strong>{formatIndoDate(item.tanggal)}</strong>
									</div>
								</td>
								<td>
									<span class="time-badge">🕒 {item.jam || '-'}</span>
								</td>
								<td>
									<div class="employee-cell">
										<div class="avatar-sm">{item.nama_karyawan.slice(0, 2).toUpperCase()}</div>
										<div>
											<strong class="emp-name">{item.nama_karyawan}</strong>
											<div class="emp-role">{item.nama_jabatan || 'Pekerja'}</div>
										</div>
									</div>
								</td>
								<td>
									<span class="badge badge-neutral proj-tag">{item.nama_projek}</span>
								</td>
								<td class="text-right">
									<strong class="nominal-text">Rp {formatRupiah(item.nominal)}</strong>
								</td>
								<td>
									<span class="note-text">{item.keterangan || '-'}</span>
								</td>
								<td>
									<span class="admin-recorder">{item.recorded_by_name || 'Admin'}</span>
								</td>
								<td class="text-center">
									<div class="action-btn-group">
										<button 
											type="button" 
											class="action-btn edit" 
											title="Edit Data Bon"
											onclick={() => openEditModal(item)}
										>
											✏️
										</button>
										<button 
											type="button" 
											class="action-btn delete" 
											title="Hapus Data Bon"
											onclick={() => deletingBon = item}
										>
											🗑️
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="table-total-row">
							<td colspan="5" class="total-label">
								{#if activeFilteredUser}
									TOTAL KASBON UNTUK {activeFilteredUser.nama.toUpperCase()} (SESUAI FILTER):
								{:else}
									TOTAL KESELURUHAN BON (SESUAI FILTER SAAT INI):
								{/if}
							</td>
							<td class="text-right total-val">
								Rp {formatRupiah(data.totalNominalView)}
							</td>
							<td colspan="3" class="total-count">
								{data.bonList.length} Transaksi Tercatat
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL TAMBAH BON BARU -->
{#if showAddModal}
	<div class="modal-backdrop" onclick={() => showAddModal = false} role="presentation">
		<div class="modal-card" onclick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-add-title" tabindex="-1">
			<div class="modal-header">
				<h3 id="modal-add-title">➕ Catat Pengambilan Bon Karyawan</h3>
				<button type="button" class="close-btn" onclick={() => showAddModal = false}>✕</button>
			</div>

			<form 
				method="POST" 
				action="?/tambahBon" 
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						showAddModal = false;
						await update();
					};
				}}
			>
				<div class="modal-body">
					<!-- Pilih Proyek -->
					<div class="form-group">
						<label for="add-projek" class="form-label">
							Proyek Lapangan <span class="required">*</span>
						</label>
						<select 
							id="add-projek" 
							name="projek_id" 
							bind:value={formProjekId} 
							onchange={onFormProjekChange}
							class="input" 
							required
						>
							{#each data.projects as p}
								<option value={String(p.id)}>{p.nama_projek} - {p.lokasi || 'Aktif'}</option>
							{/each}
						</select>
					</div>

					<!-- Pilih Karyawan -->
					<div class="form-group">
						<label for="add-karyawan" class="form-label">
							Karyawan / Pekerja <span class="required">*</span>
						</label>
						<select 
							id="add-karyawan" 
							name="karyawan_id" 
							bind:value={formKaryawanId} 
							class="input select-emp" 
							required
						>
							<option value="" disabled>-- Pilih Pekerja --</option>
							{#each formEmployees as e}
								<option value={String(e.id)}>
									{e.nama} ({e.nama_jabatan || 'Pekerja'}) {Number(e.projek_id) === Number(formProjekId) ? '⭐ Sesuai Proyek' : ''}
								</option>
							{/each}
						</select>

						<!-- Dynamic Live Badge: Current Total Bon for selected employee -->
						{#if formKaryawanId}
							<div class="live-user-bon-pill">
								<span class="icon">ℹ️</span>
								<span>Total bon saat ini: </span>
								<strong class="amt">Rp {formatRupiah(currentKaryawanTotalBon)}</strong>
							</div>
						{/if}
					</div>

					<!-- Grid Tanggal & Jam -->
					<div class="form-row">
						<!-- Tanggal (default today) -->
						<div class="form-group">
							<label for="add-tanggal" class="form-label">
								Tanggal <span class="required">*</span>
							</label>
							<input 
								id="add-tanggal" 
								type="date" 
								name="tanggal" 
								bind:value={formTanggal} 
								class="input" 
								required
							/>
							<div class="input-hint">Default: Hari ini</div>
						</div>

						<!-- Jam -->
						<div class="form-group">
							<label for="add-jam" class="form-label">
								Jam Pengambilan <span class="required">*</span>
							</label>
							<input 
								id="add-jam" 
								type="time" 
								name="jam" 
								bind:value={formJam} 
								class="input" 
								required
							/>
							<div class="quick-time-chips">
								<button type="button" class="time-chip" onclick={() => setTimePreset('now')}>Sekarang</button>
								<button type="button" class="time-chip" onclick={() => setTimePreset('08:00')}>08:00</button>
								<button type="button" class="time-chip" onclick={() => setTimePreset('12:00')}>12:00</button>
								<button type="button" class="time-chip" onclick={() => setTimePreset('16:30')}>16:30</button>
							</div>
						</div>
					</div>

					<!-- Nominal -->
					<div class="form-group">
						<label for="add-nominal" class="form-label">
							Nominal Bon (Rp)
						</label>
						<div class="input-prefix-box">
							<span class="prefix">Rp</span>
							<input 
								id="add-nominal" 
								type="number" 
								name="nominal" 
								bind:value={formNominal} 
								step="any"
								placeholder="0" 
								class="input pl-pref" 
							/>
						</div>

						<!-- Quick Nominal Chips -->
						<div class="quick-chips">
							<button type="button" class="chip" onclick={() => setNominal(20000)}>Rp 20.000</button>
							<button type="button" class="chip" onclick={() => setNominal(50000)}>Rp 50.000</button>
							<button type="button" class="chip" onclick={() => setNominal(100000)}>Rp 100.000</button>
							<button type="button" class="chip" onclick={() => setNominal(200000)}>Rp 200.000</button>
							<button type="button" class="chip" onclick={() => addNominal(50000)}>+Rp 50rb</button>
						</div>
					</div>

					<!-- Keterangan (Opsional) -->
					<div class="form-group">
						<label for="add-ket" class="form-label">Keterangan / Keperluan (Opsional)</label>
						<input 
							id="add-ket" 
							type="text" 
							name="keterangan" 
							bind:value={formKeterangan} 
							placeholder="Misal: Uang makan siang, beli obat, pulsa, rokok" 
							class="input"
						/>
					</div>

					<!-- Ringkasan Akumulasi Bon Setelah Input -->
					{#if formKaryawanId && formNominal > 0}
						<div class="total-calc-box">
							<div class="tcb-row">
								<span>Bon Baru:</span>
								<strong>Rp {formatRupiah(formNominal)}</strong>
							</div>
							<div class="tcb-row">
								<span>Total Sebelumnya:</span>
								<span>Rp {formatRupiah(currentKaryawanTotalBon)}</span>
							</div>
							<div class="tcb-divider"></div>
							<div class="tcb-row total-highlight">
								<span>Estimasi Total Bon User Ini:</span>
								<strong>Rp {formatRupiah(currentKaryawanTotalBon + formNominal)}</strong>
							</div>
						</div>
					{/if}
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => showAddModal = false}>
						Batal
					</button>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}⏳ Menyimpan...{:else}💾 Simpan Catatan Bon{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL EDIT BON -->
{#if editingBon}
	<div class="modal-backdrop" onclick={() => editingBon = null} role="presentation">
		<div class="modal-card" onclick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-edit-title" tabindex="-1">
			<div class="modal-header">
				<h3 id="modal-edit-title">✏️ Edit Catatan Bon</h3>
				<button type="button" class="close-btn" onclick={() => editingBon = null}>✕</button>
			</div>

			<form 
				method="POST" 
				action="?/editBon" 
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						editingBon = null;
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={editingBon.id} />

				<div class="modal-body">
					<div class="form-group">
						<label for="edit-projek" class="form-label">Proyek Lapangan</label>
						<select id="edit-projek" name="projek_id" bind:value={editingBon.projek_id} class="input" required>
							{#each data.projects as p}
								<option value={String(p.id)}>{p.nama_projek}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="edit-karyawan" class="form-label">Karyawan</label>
						<select id="edit-karyawan" name="karyawan_id" bind:value={editingBon.karyawan_id} class="input" required>
							{#each data.employees as e}
								<option value={String(e.id)}>{e.nama} ({e.nama_jabatan || 'Pekerja'})</option>
							{/each}
						</select>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="edit-tgl" class="form-label">Tanggal</label>
							<input id="edit-tgl" type="date" name="tanggal" bind:value={editingBon.tanggal} class="input" required />
						</div>
						<div class="form-group">
							<label for="edit-jam" class="form-label">Jam</label>
							<input id="edit-jam" type="time" name="jam" bind:value={editingBon.jam} class="input" required />
						</div>
					</div>

					<div class="form-group">
						<label for="edit-nominal" class="form-label">Nominal Bon (Rp)</label>
						<div class="input-prefix-box">
							<span class="prefix">Rp</span>
							<input 
								id="edit-nominal" 
								type="number" 
								name="nominal" 
								bind:value={editingBon.nominal} 
								step="any"
								class="input pl-pref" 
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="edit-ket" class="form-label">Keterangan</label>
						<input id="edit-ket" type="text" name="keterangan" bind:value={editingBon.keterangan} class="input" />
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => editingBon = null}>
						Batal
					</button>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}⏳ Menyimpan...{:else}💾 Simpan Perubahan{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL KONFIRMASI HAPUS -->
{#if deletingBon}
	<div class="modal-backdrop" onclick={() => deletingBon = null} role="presentation">
		<div class="modal-card modal-sm" onclick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-del-title" tabindex="-1">
			<div class="modal-header">
				<h3 id="modal-del-title">⚠️ Hapus Catatan Bon</h3>
				<button type="button" class="close-btn" onclick={() => deletingBon = null}>✕</button>
			</div>

			<form 
				method="POST" 
				action="?/hapusBon" 
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						deletingBon = null;
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={deletingBon.id} />

				<div class="modal-body">
					<p>Apakah Anda yakin ingin menghapus catatan bon berikut?</p>
					<div class="del-preview-box">
						<div><strong>Karyawan:</strong> {deletingBon.nama_karyawan}</div>
						<div><strong>Nominal:</strong> <span class="text-danger font-bold">Rp {formatRupiah(deletingBon.nominal)}</span></div>
						<div><strong>Tanggal:</strong> {formatIndoDate(deletingBon.tanggal)} jam {deletingBon.jam}</div>
						<div><strong>Proyek:</strong> {deletingBon.nama_projek}</div>
					</div>
					<p class="del-warn">Tindakan ini tidak dapat dibatalkan.</p>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => deletingBon = null}>
						Batal
					</button>
					<button type="submit" class="btn btn-danger" disabled={isSubmitting}>
						{#if isSubmitting}⏳ Menghapus...{:else}🗑️ Ya, Hapus Bon Ini{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.bon-page {
		padding-bottom: 3rem;
	}

	.page-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.back-link {
		display: inline-block;
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--primary);
		margin-bottom: 0.4rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.page-top h1 {
		font-size: 1.65rem;
		margin-bottom: 0.25rem;
	}

	.page-top p {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* User Focus Banner */
	.user-focus-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border: 1px solid #bfdbfe;
		border-radius: var(--radius-lg);
		padding: 1.15rem 1.5rem;
		margin-bottom: 1.5rem;
		gap: 1.5rem;
		flex-wrap: wrap;
		box-shadow: 0 2px 4px rgba(37, 99, 235, 0.05);
	}

	.ufb-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.ufb-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		color: white;
		font-weight: 800;
		font-size: 1.15rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
	}

	.ufb-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #1e40af;
	}

	.ufb-name {
		font-size: 1.3rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0.1rem 0;
	}

	.ufb-role {
		font-size: 0.8rem;
		color: #475569;
		font-weight: 600;
	}

	.ufb-right {
		text-align: right;
	}

	.ufb-stat-title {
		font-size: 0.72rem;
		font-weight: 700;
		color: #1e40af;
		letter-spacing: 0.04em;
	}

	.ufb-stat-val {
		font-size: 1.6rem;
		font-weight: 900;
		color: #1e3a8a;
		font-family: var(--font-heading);
	}

	.ufb-stat-note {
		font-size: 0.72rem;
		color: #64748b;
	}

	/* Stat Grid */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 1.15rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
	}

	.stat-icon-box {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.35rem;
		flex-shrink: 0;
	}

	.bg-blue { background: #eff6ff; color: #2563eb; }
	.bg-amber { background: #fffbeb; color: #d97706; }
	.bg-green { background: #ecfdf5; color: #059669; }

	.stat-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stat-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.stat-value {
		font-size: 1.3rem;
		font-weight: 800;
		font-family: var(--font-heading);
		color: var(--text-main);
		line-height: 1.2;
		margin: 0.15rem 0;
	}

	.text-primary { color: #2563eb; }
	.text-emerald { color: #059669; }

	.stat-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.quick-record-card {
		background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
		border-color: #e9d5ff;
	}

	.qrc-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.qrc-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: #6b21a8;
	}

	/* Filter Card */
	.filter-card {
		padding: 1.25rem;
		margin-bottom: 1.5rem;
		background: #ffffff;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.85rem;
		margin-bottom: 1rem;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.select-input {
		height: 38px;
		background: #f8fafc;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.85rem;
	}

	/* User Summary Section */
	.user-summary-section {
		padding: 1.25rem;
		margin-bottom: 1.5rem;
		background: #ffffff;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.section-header h2 {
		font-size: 1.15rem;
		font-weight: 800;
		color: #0f172a;
	}

	.section-header p {
		font-size: 0.825rem;
		color: var(--text-muted);
	}

	.empty-rekap {
		padding: 1.5rem;
		text-align: center;
		background: #f8fafc;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: 0.88rem;
	}

	.user-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}

	.user-bon-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		transition: all 0.15s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.user-bon-card:hover {
		border-color: #93c5fd;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
	}

	.active-filter-card {
		border-color: #2563eb;
		background: #eff6ff;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.ubc-header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 0.85rem;
	}

	.ubc-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		font-size: 0.85rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.ubc-meta {
		min-width: 0;
	}

	.ubc-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ubc-sub {
		font-size: 0.72rem;
		color: var(--text-muted);
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ubc-body {
		background: #f8fafc;
		border-radius: var(--radius-sm);
		padding: 0.65rem 0.85rem;
		margin-bottom: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.ubc-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
	}

	.ubc-label {
		color: var(--text-muted);
	}

	.ubc-count {
		font-weight: 600;
		color: #475569;
	}

	.total-row {
		border-top: 1px dashed var(--border-subtle);
		padding-top: 0.35rem;
		margin-top: 0.2rem;
	}

	.total-row .ubc-label {
		font-weight: 700;
		color: #0f172a;
	}

	.ubc-amount {
		font-size: 1.05rem;
		font-weight: 800;
		color: #dc2626;
		font-family: var(--font-heading);
	}

	.last-date-row {
		font-size: 0.72rem;
		color: #64748b;
	}

	.ubc-footer {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}

	/* History Section & Table */
	.history-section {
		padding: 1.25rem;
		background: #ffffff;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.table-responsive {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	.data-table th {
		background: #f8fafc;
		padding: 0.75rem 0.85rem;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #64748b;
		border-bottom: 1px solid var(--border-subtle);
		text-align: left;
	}

	.data-table td {
		padding: 0.8rem 0.85rem;
		border-bottom: 1px solid var(--border-subtle);
		vertical-align: middle;
	}

	.data-table tr:hover td {
		background: #fafafa;
	}

	.time-badge {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		background: #f1f5f9;
		color: #475569;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		white-space: nowrap;
	}

	.employee-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar-sm {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #e0e7ff;
		color: #3730a3;
		font-size: 0.7rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.emp-name {
		color: #0f172a;
		font-size: 0.85rem;
	}

	.emp-role {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.nominal-text {
		color: #dc2626;
		font-weight: 700;
		font-size: 0.95rem;
		font-family: var(--font-heading);
	}

	.note-text {
		color: #475569;
		font-size: 0.825rem;
	}

	.admin-recorder {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.action-btn-group {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
	}

	.action-btn {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle);
		background: #ffffff;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		transition: all 0.15s ease;
	}

	.action-btn:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.action-btn.delete:hover {
		background: #fef2f2;
		border-color: #fca5a5;
	}

	/* Footer Row Total */
	.table-total-row td {
		background: #f1f5f9;
		border-top: 2px solid #cbd5e1;
		padding: 0.85rem;
	}

	.total-label {
		font-weight: 800;
		font-size: 0.825rem;
		color: #0f172a;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		text-align: right;
	}

	.total-val {
		font-weight: 900;
		font-size: 1.15rem;
		color: #dc2626;
		font-family: var(--font-heading);
	}

	.total-count {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
	}

	.empty-state h3 {
		font-size: 1.15rem;
		margin-bottom: 0.35rem;
	}

	.empty-state p {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.modal-card {
		background: #ffffff;
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 520px;
		max-height: 90vh;
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		margin: auto;
	}

	.modal-card form {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.modal-sm {
		max-width: 420px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.15rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.modal-header h3 {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 1.25rem;
		color: var(--text-muted);
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
	}

	.close-btn:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.modal-body {
		padding: 1.25rem;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	.modal-body::-webkit-scrollbar {
		width: 6px;
	}

	.modal-body::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	.modal-body::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.modal-body::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.65rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--border-subtle);
		background: #f8fafc;
		flex-shrink: 0;
	}

	.modal-footer .btn {
		min-height: 2.5rem;
		padding: 0.5rem 1.15rem;
		font-weight: 700;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.form-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #1e293b;
	}

	.required {
		color: #dc2626;
	}

	.input-hint {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.input-prefix-box {
		position: relative;
		display: flex;
		align-items: center;
	}

	.prefix {
		position: absolute;
		left: 0.85rem;
		font-weight: 700;
		color: #64748b;
		pointer-events: none;
	}

	.pl-pref {
		padding-left: 2.25rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: #0f172a;
	}

	.quick-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.25rem;
	}

	.chip {
		background: #f1f5f9;
		border: 1px solid var(--border-subtle);
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.chip:hover {
		background: #e2e8f0;
		border-color: #cbd5e1;
	}

	.quick-time-chips {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.25rem;
		flex-wrap: wrap;
	}

	.time-chip {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		color: #475569;
		cursor: pointer;
	}

	.time-chip:hover {
		background: #e2e8f0;
	}

	.live-user-bon-pill {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: #fffbeb;
		border: 1px solid #fde68a;
		border-radius: 6px;
		padding: 0.35rem 0.65rem;
		font-size: 0.75rem;
		color: #92400e;
		margin-top: 0.25rem;
	}

	.live-user-bon-pill .amt {
		color: #b45309;
		font-weight: 800;
	}

	.total-calc-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.tcb-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.825rem;
		color: #475569;
	}

	.tcb-divider {
		height: 1px;
		background: var(--border-subtle);
		margin: 0.15rem 0;
	}

	.total-highlight {
		font-size: 0.95rem;
		font-weight: 800;
		color: #0f172a;
	}

	.total-highlight strong {
		color: #dc2626;
		font-size: 1.1rem;
		font-family: var(--font-heading);
	}

	.del-preview-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 0.75rem;
		margin: 0.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
	}

	.del-warn {
		font-size: 0.75rem;
		color: #dc2626;
		font-weight: 600;
	}

	/* Alerts */
	.alert {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
	}

	.alert-success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.alert-danger {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	@media (max-width: 768px) {
		.page-top {
			flex-direction: column;
			align-items: stretch;
		}

		.user-focus-banner {
			flex-direction: column;
			align-items: stretch;
			text-align: left;
		}

		.ufb-right {
			text-align: left;
			border-top: 1px dashed #bfdbfe;
			padding-top: 0.85rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-card {
			max-height: calc(100dvh - 1rem);
			border-radius: var(--radius-md);
		}

		.modal-body {
			padding: 1rem;
			gap: 0.85rem;
		}

		.modal-footer {
			padding: 0.85rem 1rem;
		}
	}
</style>
