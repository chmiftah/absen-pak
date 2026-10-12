<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data, form }: PageProps = $props();
</script>

<div class="register-wrapper">
	<div class="register-card">
		<div class="card-top">
			<a href="/login" class="back-link">← Kembali ke Login</a>
			<h1>Daftar Karyawan Baru</h1>
			<p>Buat akun untuk mencatat kehadiran harian proyek</p>
		</div>

		{#if form?.error}
			<div class="alert-error">
				<span>⚠️</span>
				<span>{form.error}</span>
			</div>
		{/if}

		<form method="POST" class="register-form">
			<div class="form-group">
				<label for="nama" class="form-label">Nama Lengkap Pekerja</label>
				<input id="nama" name="nama" type="text" class="input" placeholder="Contoh: Budi Santoso" required />
			</div>

			<div class="grid-2">
				<div class="form-group">
					<label for="username" class="form-label">Username Login</label>
					<input id="username" name="username" type="text" class="input" placeholder="Contoh: budi" required autocomplete="username" />
				</div>

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<input id="password" name="password" type="password" class="input" placeholder="Minimal 6 karakter" required autocomplete="new-password" />
				</div>
			</div>

			<div class="grid-2">
				<div class="form-group">
					<label for="jabatan_id" class="form-label">Jabatan Pekerja</label>
					<select id="jabatan_id" name="jabatan_id" class="select" required>
						<option value="">-- Pilih Jabatan --</option>
						{#each data.jabatans as j}
							<option value={j.id}>{j.nama_jabatan}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="no_hp" class="form-label">Nomor WhatsApp / HP</label>
					<input id="no_hp" name="no_hp" type="tel" class="input" placeholder="08xxxxxxxxxx" />
				</div>
			</div>

			<div class="rates-box">
				<h3>Tarif / Rate Gaji Awal (Bisa disesuaikan Admin)</h3>
				<div class="rates-grid">
					<div class="form-group">
						<label for="rate_harian" class="form-label">Gaji Harian (Rp)</label>
						<input id="rate_harian" name="rate_harian" type="number" class="input" value="100000" step="5000" />
					</div>
					<div class="form-group">
						<label for="rate_lembur_jam" class="form-label">Lembur Per Jam (Rp)</label>
						<input id="rate_lembur_jam" name="rate_lembur_jam" type="number" class="input" value="15000" step="1000" />
					</div>
					<div class="form-group">
						<label for="rate_lembur_hari" class="form-label">Lembur Per Hari (Rp)</label>
						<input id="rate_lembur_hari" name="rate_lembur_hari" type="number" class="input" value="100000" step="5000" />
					</div>
				</div>
			</div>

			<button type="submit" class="btn btn-primary btn-lg btn-full">
				Daftar & Langsung Masuk ➔
			</button>
		</form>
	</div>
</div>

<style>
	.register-wrapper {
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.register-card {
		background: white;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 2.25rem;
		width: 100%;
		max-width: 620px;
		box-shadow: var(--shadow-xl);
	}

	.card-top {
		margin-bottom: 1.75rem;
	}

	.back-link {
		display: inline-block;
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.back-link:hover {
		color: var(--primary);
	}

	.card-top h1 {
		font-size: 1.6rem;
		margin-bottom: 0.25rem;
	}

	.card-top p {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.alert-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		margin-bottom: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.register-form {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 600px) {
		.grid-2 { grid-template-columns: 1fr; }
	}

	.rates-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 1.2rem;
	}

	.rates-box h3 {
		font-size: 0.9rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		color: #334155;
	}

	.rates-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 600px) {
		.rates-grid { grid-template-columns: 1fr; }
	}
</style>
