<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let showAddModal = $state(false);
	let editingProjek = $state<any>(null);
	let namaProjek = $state('');
	let lokasi = $state('');
	let isSubmitting = $state(false);
</script>

<div class="container proyek-page">
	<div class="page-top">
		<div>
			<a href="/admin" class="back-link">← Kembali ke Dashboard</a>
			<h1>Master Data Proyek</h1>
			<p>Kelola lokasi proyek konstruksi dan status pengerjaannya</p>
		</div>

		<button class="btn btn-primary" onclick={() => showAddModal = true}>
			➕ Tambah Proyek Baru
		</button>
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

	<div class="card table-card">
		<div class="card-header">
			<h2>Daftar Proyek Konstruksi ({data.projects.length})</h2>
		</div>

		<div class="table-responsive">
			<table class="data-table">
				<thead>
					<tr>
						<th>No.</th>
						<th>Nama Proyek</th>
						<th>Lokasi</th>
						<th>Pekerja Terlibat</th>
						<th>Total Absen</th>
						<th>Status</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects as p, i}
						<tr>
							<td>{i + 1}</td>
							<td>
								<strong>{p.nama_projek}</strong>
							</td>
							<td>{p.lokasi || '-'}</td>
							<td>
								<span class="badge badge-primary">{p.total_pekerja} Pekerja</span>
							</td>
							<td>
								<span class="badge badge-neutral">{p.total_absensi} Hari</span>
							</td>
							<td>
								<form method="POST" action="?/toggleStatus" style="display: inline;" use:enhance>
									<input type="hidden" name="id" value={p.id} />
									<input type="hidden" name="status" value={p.status} />
									<button type="submit" class="badge-btn {p.status === 'AKTIF' ? 'badge-success' : 'badge-neutral'}">
										{p.status} (Klik ubah)
									</button>
								</form>
							</td>
							<td class="text-right actions-cell">
								<a href={`/admin/laporan?projek_id=${p.id}`} class="btn btn-sm btn-secondary">
									💰 Laporan
								</a>
								<button type="button" class="btn btn-sm btn-secondary" onclick={() => editingProjek = { ...p }}>
									✏️ Edit
								</button>
								<form 
									method="POST" 
									action="?/hapus" 
									style="display: inline;"
									use:enhance={({ cancel }) => {
										if (!confirm(`Hapus proyek '${p.nama_projek}'?`)) {
											cancel();
										}
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={p.id} />
									<button type="submit" class="btn btn-sm btn-danger">Hapus</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Tambah Proyek -->
	{#if showAddModal}
		<div class="modal-backdrop" onclick={() => showAddModal = false} role="presentation">
			<div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Tambah Proyek Baru</h2>
					<button type="button" class="close-btn" onclick={() => showAddModal = false}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/tambah"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								showAddModal = false;
								namaProjek = '';
								lokasi = '';
							}
						};
					}}
				>
					<div class="form-group">
						<label for="nama_projek" class="form-label">Nama Proyek</label>
						<input id="nama_projek" name="nama_projek" type="text" class="input" placeholder="Contoh: Ruko Sentra Niaga, Con Cat, dll" bind:value={namaProjek} required />
					</div>

					<div class="form-group">
						<label for="lokasi" class="form-label">Lokasi / Keterangan</label>
						<input id="lokasi" name="lokasi" type="text" class="input" placeholder="Contoh: Blok B No. 12, Area Timur" bind:value={lokasi} />
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => showAddModal = false}>Batal</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Simpan Proyek{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Modal Edit Proyek -->
	{#if editingProjek}
		<div class="modal-backdrop" onclick={() => editingProjek = null} role="presentation">
			<div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>Edit Proyek: {editingProjek.nama_projek}</h2>
					<button type="button" class="close-btn" onclick={() => editingProjek = null}>✕</button>
				</div>

				<form 
					method="POST" 
					action="?/edit"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							await update();
							if (result.type === 'success') {
								editingProjek = null;
							}
						};
					}}
				>
					<input type="hidden" name="id" value={editingProjek.id} />

					<div class="form-group">
						<label for="edit_nama_projek" class="form-label">Nama Proyek</label>
						<input id="edit_nama_projek" name="nama_projek" type="text" class="input" bind:value={editingProjek.nama_projek} required />
					</div>

					<div class="form-group">
						<label for="edit_lokasi" class="form-label">Lokasi / Keterangan</label>
						<input id="edit_lokasi" name="lokasi" type="text" class="input" bind:value={editingProjek.lokasi} />
					</div>

					<div class="form-group">
						<label for="edit_status" class="form-label">Status Proyek</label>
						<select id="edit_status" name="status" class="select" bind:value={editingProjek.status}>
							<option value="AKTIF">AKTIF</option>
							<option value="SELESAI">SELESAI</option>
						</select>
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => editingProjek = null}>Batal</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}Menyimpan...{:else}Simpan Perubahan{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	.proyek-page {
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

	.back-link {
		color: var(--primary);
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		display: inline-block;
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

	.badge-btn {
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
	}

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
