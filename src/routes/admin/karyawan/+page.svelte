<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let showAddModal = $state(false);
	let showJabatanModal = $state(false);
	let editingKaryawan = $state<any>(null);
	let editingJabatan = $state<any>(null);
	let isSubmitting = $state(false);

	function formatRupiah(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	function openEditModal(k: any) {
		editingKaryawan = { ...k };
	}
</script>

<div class="container karyawan-page">
	<div class="page-top">
		<div>
			<a href="/admin" class="back-link">← Kembali ke Dashboard</a>
			<h1>Master Karyawan, Jabatan & Rate Gaji</h1>
			<p>Kelola data pekerja, jabatan, serta penyesuaian tarif harian dan lembur</p>
		</div>

		<div class="top-actions">
			<button type="button" class="btn btn-secondary" onclick={() => showJabatanModal = true}>
				🏷️ Kelola Jabatan ({data.jabatans.length})
			</button>
			<button type="button" class="btn btn-primary" onclick={() => showAddModal = true}>
				➕ Tambah Karyawan Baru
			</button>
		</div>
	</div>

	<!-- Info Snapshot Notice -->
	<div class="snapshot-alert">
		<span class="alert-icon">🛡️</span>
		<div>
			<strong>Keamanan Rate Historis Terjamin (Snapshot System):</strong>
			<p>
				Anda bebas mengubah tarif rate gaji karyawan kapan saja. Perubahan rate hanya akan berlaku untuk absensi hari ini dan seterusnya. <strong>Gaji dan laporan bulan-bulan sebelumnya tidak akan berubah</strong> karena sudah terkunci pada rate saat absen diinput.
			</p>
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

	<!-- Employees Table -->
	<div class="card table-card">
		<div class="card-header">
			<h2>Daftar Pekerja & Tarif Aktif ({data.employees.length})</h2>
		</div>

		<div class="table-responsive">
			<table class="data-table">
				<thead>
					<tr>
						<th>No.</th>
						<th>Nama Pekerja</th>
						<th>Jabatan (JBT)</th>
						<th>Rate Harian</th>
						<th>Rate Lembur / Jam</th>
						<th>Rate Lembur / Hari</th>
						<th>Akun Login</th>
						<th>Status</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.employees as k, i}
						<tr>
							<td>{i + 1}</td>
							<td>
								<strong>{k.nama}</strong>
								{#if k.no_hp}
									<div class="sub-text">📞 {k.no_hp}</div>
								{/if}
							</td>
							<td>
								<span class="badge badge-purple">{k.nama_jabatan || '-'}</span>
							</td>
							<td>
								<span class="rate-badge rate-green">{formatRupiah(k.rate_harian)}</span>
							</td>
							<td>
								<span class="rate-badge rate-orange">{formatRupiah(k.rate_lembur_jam)}/jam</span>
							</td>
							<td>
								<span class="rate-badge rate-blue">{formatRupiah(k.rate_lembur_hari)}</span>
							</td>
							<td>
								{#if k.username}
									<span class="badge badge-neutral">User: {k.username}</span>
								{:else}
									<span class="text-muted">Tanpa Login</span>
								{/if}
							</td>
							<td>
								<form method="POST" action="?/toggleStatusKaryawan" style="display:inline;" use:enhance>
									<input type="hidden" name="id" value={k.id} />
									<input type="hidden" name="status_aktif" value={String(k.status_aktif)} />
									<button type="submit" class="status-btn {k.status_aktif ? 'status-active' : 'status-inactive'}">
										{k.status_aktif ? 'Aktif' : 'Non-Aktif'}
									</button>
								</form>
							</td>
							<td class="text-right actions-cell">
								<button type="button" class="btn btn-sm btn-secondary" onclick={() => openEditModal(k)}>
									✏️ Edit
								</button>
								<form 
									method="POST" 
									action="?/hapusKaryawan" 
									style="display:inline;"
									use:enhance={({ cancel }) => {
										if (!confirm(`Hapus karyawan '${k.nama}' beserta seluruh riwayat terkait?`)) {
											cancel();
										}
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={k.id} />
									<button type="submit" class="btn btn-sm btn-danger">🗑️ Hapus</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Edit Karyawan & Rate -->
	{#if editingKaryawan}
		<div class="modal-backdrop" onclick={() => editingKaryawan = null} role="presentation">
			<div class="modal-card modal-lg" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Edit Data & Rate: {editingKaryawan.nama}</h2>
					<button type="button" class="close-btn" onclick={() => editingKaryawan = null}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/editKaryawan"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								editingKaryawan = null;
							}
						};
					}}
				>
					<input type="hidden" name="id" value={editingKaryawan.id} />

					<div class="form-grid-2">
						<div class="form-group">
							<label for="edit_nama" class="form-label">Nama Pekerja</label>
							<input id="edit_nama" name="nama" type="text" class="input" bind:value={editingKaryawan.nama} required />
						</div>

						<div class="form-group">
							<label for="edit_jabatan" class="form-label">Jabatan (JBT)</label>
							<select id="edit_jabatan" name="jabatan_id" class="select" bind:value={editingKaryawan.jabatan_id}>
								<option value="">-- Pilih Jabatan --</option>
								{#each data.jabatans as j}
									<option value={j.id}>{j.nama_jabatan}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="edit_nohp" class="form-label">Nomor WhatsApp / HP</label>
						<input id="edit_nohp" name="no_hp" type="text" class="input" bind:value={editingKaryawan.no_hp} />
					</div>

					<div class="rates-edit-box">
						<div class="form-group">
							<label for="edit_rate_harian" class="form-label">Rate Normal Harian (Rp)</label>
							<input id="edit_rate_harian" name="rate_harian" type="number" class="input" bind:value={editingKaryawan.rate_harian} step="5000" required />
						</div>

						<div class="form-group">
							<label for="edit_rate_jam" class="form-label">Rate Lembur Per Jam (Rp)</label>
							<input id="edit_rate_jam" name="rate_lembur_jam" type="number" class="input" bind:value={editingKaryawan.rate_lembur_jam} step="1000" required />
						</div>

						<div class="form-group">
							<label for="edit_rate_hari" class="form-label">Rate Lembur Per Hari (Rp)</label>
							<input id="edit_rate_hari" name="rate_lembur_hari" type="number" class="input" bind:value={editingKaryawan.rate_lembur_hari} step="5000" required />
						</div>
					</div>

					<!-- Account Login Section -->
					<div class="auth-optional-box">
						<h4>Akun Login Tukang (Opsional)</h4>
						<div class="form-grid-2">
							<div class="form-group">
								<label for="edit_user" class="form-label">Username</label>
								<input id="edit_user" name="username" type="text" class="input" placeholder="Username login" bind:value={editingKaryawan.username} />
							</div>
							<div class="form-group">
								<label for="edit_pwd" class="form-label">Password Baru (Kosongkan jika tak diubah)</label>
								<input id="edit_pwd" name="password" type="password" class="input" placeholder="Masukkan jika ingin reset sandi" />
							</div>
						</div>
					</div>

					<p class="edit-hint">
						⚠️ Pengubahan tarif rate ini berlaku untuk absensi hari ini ke depan. Absensi historis tetap aman terkunci pada rate saat tanggal absensi dicatat.
					</p>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => editingKaryawan = null}>Batal</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Simpan Perubahan Karyawan{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Tambah Karyawan -->
	{#if showAddModal}
		<div class="modal-backdrop" onclick={() => showAddModal = false} role="presentation">
			<div class="modal-card modal-lg" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Tambah Pekerja Baru</h2>
					<button type="button" class="close-btn" onclick={() => showAddModal = false}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/tambahKaryawan"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								showAddModal = false;
							}
						};
					}}
				>
					<div class="form-grid-2">
						<div class="form-group">
							<label for="add_nama" class="form-label">Nama Pekerja</label>
							<input id="add_nama" name="nama" type="text" class="input" placeholder="Contoh: Sukirman" required />
						</div>

						<div class="form-group">
							<label for="add_jabatan" class="form-label">Jabatan (JBT)</label>
							<select id="add_jabatan" name="jabatan_id" class="select" required>
								<option value="">-- Pilih Jabatan --</option>
								{#each data.jabatans as j}
									<option value={j.id}>{j.nama_jabatan}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="add_nohp" class="form-label">Nomor WhatsApp / HP</label>
						<input id="add_nohp" name="no_hp" type="tel" class="input" placeholder="08xxxxxxxxxx" />
					</div>

					<div class="rates-section">
						<h4>Tarif Upah / Rate Gaji</h4>
						<div class="rates-grid-3">
							<div class="form-group">
								<label for="add_rate_harian" class="form-label">Normal Harian (Rp)</label>
								<input id="add_rate_harian" name="rate_harian" type="number" class="input" value="100000" step="5000" required />
							</div>
							<div class="form-group">
								<label for="add_rate_jam" class="form-label">Lembur Per Jam (Rp)</label>
								<input id="add_rate_jam" name="rate_lembur_jam" type="number" class="input" value="15000" step="1000" required />
							</div>
							<div class="form-group">
								<label for="add_rate_hari" class="form-label">Lembur Per Hari (Rp)</label>
								<input id="add_rate_hari" name="rate_lembur_hari" type="number" class="input" value="100000" step="5000" required />
							</div>
						</div>
					</div>

					<div class="auth-optional-box">
						<h4>Akun Login Tukang (Opsional - untuk Absen Mandiri via HP)</h4>
						<div class="form-grid-2">
							<div class="form-group">
								<label for="add_user" class="form-label">Username</label>
								<input id="add_user" name="username" type="text" class="input" placeholder="Contoh: sukirman" />
							</div>
							<div class="form-group">
								<label for="add_pwd" class="form-label">Password</label>
								<input id="add_pwd" name="password" type="password" class="input" placeholder="Contoh: 123456" />
							</div>
						</div>
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => showAddModal = false}>Batal</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Daftarkan Karyawan{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Kelola Jabatan (CRUD Jabatan) -->
	{#if showJabatanModal}
		<div class="modal-backdrop" onclick={() => { showJabatanModal = false; editingJabatan = null; }} role="presentation">
			<div class="modal-card modal-lg" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Master Data Jabatan</h2>
					<button type="button" class="close-btn" onclick={() => { showJabatanModal = false; editingJabatan = null; }}>✕</button>
				</div>

				<!-- Existing Jabatan List with Edit / Delete -->
				<div class="jabatan-manager-box">
					<div class="section-title-sm">Daftar Jabatan Saat Ini:</div>
					<div class="jabatan-table-wrap">
						<table class="data-table">
							<thead>
								<tr>
									<th>Nama Jabatan</th>
									<th>Keterangan</th>
									<th>Pekerja</th>
									<th class="text-right">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each data.jabatans as j}
									<tr>
										<td><strong>{j.nama_jabatan}</strong></td>
										<td><small class="text-muted">{j.keterangan || '-'}</small></td>
										<td><span class="badge badge-purple">{j.total_karyawan} orang</span></td>
										<td class="text-right">
											<button type="button" class="btn btn-sm btn-secondary" onclick={() => editingJabatan = { ...j }}>
												✏️ Edit
											</button>
											<form 
												method="POST" 
												action="?/hapusJabatan" 
												style="display:inline;"
												use:enhance={({ cancel }) => {
													if (!confirm(`Hapus jabatan '${j.nama_jabatan}'?`)) {
														cancel();
													}
													return async ({ update }) => {
														await update();
													};
												}}
											>
												<input type="hidden" name="id" value={j.id} />
												<button type="submit" class="btn btn-sm btn-danger">Hapus</button>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				{#if editingJabatan}
					<!-- Form Edit Jabatan -->
					<form 
						method="POST" 
						action="?/editJabatan"
						class="j-form edit-j-highlight"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								await update();
								if (result.type === 'success') {
									editingJabatan = null;
								}
							};
						}}
					>
						<h4>✏️ Ubah Jabatan: {editingJabatan.nama_jabatan}</h4>
						<input type="hidden" name="id" value={editingJabatan.id} />

						<div class="form-group">
							<label for="edit_j_nama" class="form-label">Nama Jabatan</label>
							<input id="edit_j_nama" name="nama_jabatan" type="text" class="input" bind:value={editingJabatan.nama_jabatan} required />
						</div>
						<div class="form-group">
							<label for="edit_j_ket" class="form-label">Keterangan</label>
							<input id="edit_j_ket" name="keterangan" type="text" class="input" bind:value={editingJabatan.keterangan} />
						</div>

						<div class="modal-actions">
							<button type="button" class="btn btn-secondary" onclick={() => editingJabatan = null}>Batal Ubah</button>
							<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
								{#if isSubmitting}Menyimpan...{:else}Simpan Perubahan Jabatan{/if}
							</button>
						</div>
					</form>
				{:else}
					<!-- Form Tambah Jabatan Baru -->
					<form 
						method="POST" 
						action="?/tambahJabatan" 
						class="j-form"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ update }) => {
								isSubmitting = false;
								await update();
							};
						}}
					>
						<h4>➕ Tambah Jabatan Baru:</h4>
						<div class="form-group">
							<label for="j_nama" class="form-label">Nama Jabatan</label>
							<input id="j_nama" name="nama_jabatan" type="text" class="input" placeholder="Contoh: Tukang Cat, Mandor, dll" required />
						</div>
						<div class="form-group">
							<label for="j_ket" class="form-label">Keterangan (Opsional)</label>
							<input id="j_ket" name="keterangan" type="text" class="input" placeholder="Catatan lingkup kerja" />
						</div>

						<div class="modal-actions">
							<button type="button" class="btn btn-secondary" onclick={() => showJabatanModal = false}>Tutup</button>
							<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
								{#if isSubmitting}Menyimpan...{:else}Simpan Jabatan Baru{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.karyawan-page {
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

	.snapshot-alert {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}

	.alert-icon {
		font-size: 1.5rem;
	}

	.snapshot-alert strong {
		color: #1e40af;
		font-size: 0.9rem;
	}

	.snapshot-alert p {
		color: #1e3a8a;
		font-size: 0.825rem;
		margin-top: 0.2rem;
		line-height: 1.4;
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

	.rate-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: -0.01em;
	}

	.rate-green { background: #dcfce7; color: #166534; }
	.rate-orange { background: #ffedd5; color: #9a3412; }
	.rate-blue { background: #dbeafe; color: #1e40af; }

	.status-btn {
		border: none;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.status-active { background: #dcfce7; color: #166534; }
	.status-inactive { background: #f1f5f9; color: #64748b; }

	.actions-cell {
		display: flex;
		gap: 0.4rem;
		justify-content: flex-end;
		align-items: center;
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
		max-width: 500px;
		box-shadow: var(--shadow-xl);
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-lg {
		max-width: 650px;
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

	.rates-section, .rates-edit-box {
		background: var(--bg-subtle);
		padding: 1rem;
		border-radius: var(--radius-lg);
		margin: 1.25rem 0;
	}

	.rates-section h4 {
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
		color: var(--text-main);
	}

	.rates-grid-3, .rates-edit-box {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.auth-optional-box {
		border: 1px dashed var(--border-subtle);
		padding: 1rem;
		border-radius: var(--radius-lg);
		margin-bottom: 1.25rem;
	}

	.auth-optional-box h4 {
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
		color: var(--text-muted);
	}

	.edit-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.4;
		margin-top: 0.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.jabatan-manager-box {
		margin-bottom: 1.5rem;
	}

	.section-title-sm {
		font-size: 0.85rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--text-main);
	}

	.jabatan-table-wrap {
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		overflow: hidden;
		max-height: 220px;
		overflow-y: auto;
	}

	.j-form {
		border-top: 2px solid var(--border-subtle);
		padding-top: 1.25rem;
	}

	.edit-j-highlight {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		padding: 1rem;
		border-radius: var(--radius-lg);
	}

	.j-form h4 {
		margin-bottom: 1rem;
		font-size: 0.9rem;
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

	@media (max-width: 640px) {
		.form-grid-2, .rates-grid-3, .rates-edit-box {
			grid-template-columns: 1fr;
		}
	}
</style>
