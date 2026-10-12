<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data, form }: PageProps = $props();

	let showAddModal = $state(false);
	let showJabatanModal = $state(false);
	let editingKaryawan = $state<any>(null);

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
			<button class="btn btn-secondary" onclick={() => showJabatanModal = true}>
				🏷️ Kelola Jabatan ({data.jabatans.length})
			</button>
			<button class="btn btn-primary" onclick={() => showAddModal = true}>
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
								<form method="POST" action="?/toggleStatusKaryawan" style="display:inline;">
									<input type="hidden" name="id" value={k.id} />
									<input type="hidden" name="status_aktif" value={String(k.status_aktif)} />
									<button type="submit" class="status-btn {k.status_aktif ? 'status-active' : 'status-inactive'}">
										{k.status_aktif ? 'Aktif' : 'Non-Aktif'}
									</button>
								</form>
							</td>
							<td class="text-right">
								<button class="btn btn-sm btn-secondary" onclick={() => openEditModal(k)}>
									✏️ Edit Rate / Info
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Edit Rate & Info -->
	{#if editingKaryawan}
		<div class="modal-backdrop" onclick={() => editingKaryawan = null}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Ubah Rate Gaji: {editingKaryawan.nama}</h2>
					<button class="close-btn" onclick={() => editingKaryawan = null}>✕</button>
				</div>

				<form method="POST" action="?/updateRate" onsubmit={() => editingKaryawan = null}>
					<input type="hidden" name="id" value={editingKaryawan.id} />

					<div class="form-group">
						<label for="edit_jabatan" class="form-label">Jabatan (JBT)</label>
						<select id="edit_jabatan" name="jabatan_id" class="select" bind:value={editingKaryawan.jabatan_id}>
							<option value="">-- Pilih Jabatan --</option>
							{#each data.jabatans as j}
								<option value={j.id}>{j.nama_jabatan}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="edit_nohp" class="form-label">Nomor HP</label>
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

					<p class="edit-hint">
						⚠️ Pengubahan rate ini berlaku untuk absensi hari ini ke depan. Absensi bulan sebelumnya tetap menggunakan rate saat tanggal bersangkutan.
					</p>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => editingKaryawan = null}>Batal</button>
						<button type="submit" class="btn btn-primary">Simpan Perubahan Rate</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Tambah Karyawan -->
	{#if showAddModal}
		<div class="modal-backdrop" onclick={() => showAddModal = false}>
			<div class="modal-card modal-lg" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Tambah Pekerja Baru</h2>
					<button class="close-btn" onclick={() => showAddModal = false}>✕</button>
				</div>

				<form method="POST" action="?/tambahKaryawan" onsubmit={() => showAddModal = false}>
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
						<button type="submit" class="btn btn-primary">Daftarkan Karyawan</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Tambah Jabatan -->
	{#if showJabatanModal}
		<div class="modal-backdrop" onclick={() => showJabatanModal = false}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Master Data Jabatan</h2>
					<button class="close-btn" onclick={() => showJabatanModal = false}>✕</button>
				</div>

				<div class="existing-jabatan-list">
					<strong>Jabatan Tersedia:</strong>
					<div class="j-chips">
						{#each data.jabatans as j}
							<span class="badge badge-purple">{j.nama_jabatan} ({j.total_karyawan} orang)</span>
						{/each}
					</div>
				</div>

				<form method="POST" action="?/tambahJabatan" onsubmit={() => showJabatanModal = false} class="j-form">
					<h4>Tambah Jabatan Baru:</h4>
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
						<button type="submit" class="btn btn-primary">Simpan Jabatan</button>
					</div>
				</form>
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

	.sub-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.rate-badge {
		font-weight: 700;
		font-size: 0.825rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		display: inline-block;
	}

	.rate-green { background: #ecfdf5; color: #047857; }
	.rate-orange { background: #fffbeb; color: #b45309; }
	.rate-blue { background: #eff6ff; color: #1d4ed8; }

	.status-btn {
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status-active { background: #ecfdf5; color: #065f46; }
	.status-inactive { background: #fef2f2; color: #991b1b; }

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
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
	}

	.modal-lg {
		max-width: 640px;
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

	.rates-section, .auth-optional-box, .rates-edit-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 1rem;
		margin: 1rem 0;
	}

	.rates-section h4, .auth-optional-box h4 {
		font-size: 0.85rem;
		color: #334155;
		margin-bottom: 0.75rem;
	}

	.rates-grid-3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 600px) {
		.rates-grid-3, .form-grid-2 { grid-template-columns: 1fr; }
	}

	.edit-hint {
		font-size: 0.75rem;
		color: #92400e;
		background: #fffbeb;
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		margin-top: 0.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.existing-jabatan-list {
		margin-bottom: 1.25rem;
	}

	.j-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	.j-form h4 {
		margin-bottom: 0.75rem;
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
