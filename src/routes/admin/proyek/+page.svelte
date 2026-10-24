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
		max-width: 500px;
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
	}

	@keyframes slideUpModal {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
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
