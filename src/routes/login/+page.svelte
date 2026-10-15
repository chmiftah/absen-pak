<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isSubmitting = $state(false);

	// Demo project selection
	let selectedProjekId = $state<number>(
		data.projects.find((p) => p.nama_projek.toLowerCase().includes('ciputra'))?.id ||
		data.projects[0]?.id || 0
	);

	// Filter workers based on selected project
	let currentWorkers = $derived(
		data.projectWorkers.filter((w) => Number(w.projek_id) === Number(selectedProjekId))
	);

	let activeProjectObj = $derived(
		data.projects.find((p) => p.id === selectedProjekId)
	);

	function fillAndLogin(u: string, p: string, autoSubmit = false) {
		username = u;
		password = p;
		if (autoSubmit) {
			const formEl = document.getElementById('mainLoginForm') as HTMLFormElement;
			if (formEl) {
				setTimeout(() => formEl.requestSubmit(), 50);
			}
		}
	}

	function formatRupiah(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}
</script>

<div class="login-wrapper">
	<div class="login-card">
		<div class="login-header">
			<div class="brand-badge-large">🔨 AbsenPak</div>
			<h1>Masuk Aplikasi</h1>
			<p>Sistem Absensi & Laporan Penggajian Mandiri Proyek</p>
		</div>

		{#if form?.error}
			<div class="alert-error">
				<span>⚠️</span>
				<span>{form.error}</span>
			</div>
		{/if}

		<form id="mainLoginForm" method="POST" class="login-form" use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}>
			<div class="form-group">
				<label for="username" class="form-label">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					class="input"
					placeholder="Masukkan username"
					bind:value={username}
					required
					autocomplete="username"
				/>
			</div>

			<div class="form-group">
				<div class="label-row">
					<label for="password" class="form-label">Password</label>
					<button 
						type="button" 
						class="text-link" 
						onclick={() => showPassword = !showPassword}
					>
						{showPassword ? 'Sembunyikan' : 'Lihat'}
					</button>
				</div>
				<input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					class="input"
					placeholder="Masukkan password"
					bind:value={password}
					required
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="btn btn-primary btn-lg btn-full" disabled={isSubmitting}>
				{#if isSubmitting}⏳ Masuk...{:else}Masuk Sekarang ➔{/if}
			</button>
		</form>

		<div class="daftar-footer">
			<span>Belum terdaftar? </span>
			<a href="/daftar" class="register-link">Daftar Karyawan Baru</a>
		</div>

		<!-- QUICK DEMO SWITCHER BY PROJECT -->
		<div class="quick-demo-section">
			<div class="divider">
				<span>⚡ Pilih Akun Demo Berdasarkan Proyek</span>
			</div>

			<!-- Quick Admin Login Banner -->
			<div class="admin-quick-box">
				<div class="aq-left">
					<span class="aq-icon">👑</span>
					<div>
						<strong>Akun Administrator</strong>
						<p>User: <code>admin</code> • Akses semua proyek & laporan gaji</p>
					</div>
				</div>
				<button 
					type="button" 
					class="btn-demo-action btn-admin-act"
					onclick={() => fillAndLogin('admin', 'admin123', true)}
				>
					Masuk Admin ➔
				</button>
			</div>

			<!-- Project Filter Selector -->
			<div class="proj-selector-header">
				<span class="ps-title">🏗️ Pilih Proyek Lapangan:</span>
			</div>

			<div class="project-pill-list">
				{#each data.projects as p}
					<button
						type="button"
						class="proj-pill {selectedProjekId === p.id ? 'active' : ''}"
						onclick={() => selectedProjekId = p.id}
					>
						<strong>{p.nama_projek}</strong>
						<small>
							{data.projectWorkers.filter(w => Number(w.projek_id) === p.id).length} Pekerja
						</small>
					</button>
				{/each}
			</div>

			<!-- Worker Accounts Grid for Selected Project -->
			<div class="workers-demo-box">
				<div class="wdb-header">
					<span>Pekerja di Proyek <strong>{activeProjectObj?.nama_projek}</strong> ({currentWorkers.length}):</span>
					<small class="text-muted">Password: <code>123456</code></small>
				</div>

				{#if currentWorkers.length === 0}
					<p class="text-muted empty-text">Belum ada pekerja terdata pada proyek ini.</p>
				{:else}
					<div class="workers-demo-grid">
						{#each currentWorkers as w}
							<button
								type="button"
								class="worker-demo-card {username === w.username ? 'selected-card' : ''}"
								onclick={() => fillAndLogin(w.username, '123456', true)}
								title="Klik untuk langsung masuk sebagai {w.nama}"
							>
								<div class="wdc-avatar">
									{w.nama.slice(0, 2).toUpperCase()}
								</div>
								<div class="wdc-info">
									<div class="wdc-name">{w.nama}</div>
									<div class="wdc-role">{w.nama_jabatan || 'Tukang'} • {formatRupiah(w.rate_harian)}</div>
									<div class="wdc-user">User: <code>{w.username}</code></div>
								</div>
								<div class="wdc-go">
									➔
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.login-wrapper {
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 1rem;
	}

	.login-card {
		background: white;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 2.25rem 2rem;
		width: 100%;
		max-width: 540px;
		box-shadow: var(--shadow-xl);
	}

	.login-header {
		text-align: center;
		margin-bottom: 1.75rem;
	}

	.brand-badge-large {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #eff6ff;
		color: #1e40af;
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 800;
		padding: 0.4rem 1rem;
		border-radius: 9999px;
		margin-bottom: 0.75rem;
		border: 1px solid #bfdbfe;
	}

	.login-header h1 {
		font-size: 1.75rem;
		color: #0f172a;
		margin-bottom: 0.25rem;
	}

	.login-header p {
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

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.text-link {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.8rem;
		cursor: pointer;
		font-weight: 600;
	}

	.daftar-footer {
		text-align: center;
		margin-top: 1.25rem;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.register-link {
		color: var(--primary);
		font-weight: 700;
	}

	.register-link:hover {
		text-decoration: underline;
	}

	/* Quick Demo Section */
	.quick-demo-section {
		margin-top: 2rem;
		border-top: 1px dashed var(--border-strong);
		padding-top: 1.5rem;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin-bottom: 1.25rem;
	}

	.divider span {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.admin-quick-box {
		background: #fffbeb;
		border: 1px solid #fde68a;
		border-radius: var(--radius-lg);
		padding: 0.85rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.aq-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.aq-icon {
		font-size: 1.5rem;
	}

	.aq-left strong {
		color: #92400e;
		font-size: 0.9rem;
		display: block;
	}

	.aq-left p {
		color: #b45309;
		font-size: 0.75rem;
		margin: 0;
	}

	.aq-left code {
		background: #fef3c7;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		font-weight: 700;
	}

	.btn-demo-action {
		border: none;
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--transition-fast);
	}

	.btn-admin-act {
		background: #f59e0b;
		color: white;
	}

	.btn-admin-act:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	.proj-selector-header {
		margin-bottom: 0.5rem;
	}

	.ps-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-main);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.project-pill-list {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.proj-pill {
		flex: 1;
		min-width: 140px;
		padding: 0.65rem 0.85rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		background: #f8fafc;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		transition: all var(--transition-fast);
	}

	.proj-pill strong {
		font-size: 0.875rem;
		color: var(--text-main);
	}

	.proj-pill small {
		font-size: 0.725rem;
		color: var(--text-muted);
	}

	.proj-pill.active {
		background: #eff6ff;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.proj-pill.active strong {
		color: #1d4ed8;
	}

	.workers-demo-box {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 1rem;
	}

	.wdb-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8rem;
		color: var(--text-main);
		margin-bottom: 0.75rem;
	}

	.wdb-header code {
		background: #e2e8f0;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		font-weight: 700;
	}

	.workers-demo-grid {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		max-height: 280px;
		overflow-y: auto;
		padding-right: 0.25rem;
	}

	.worker-demo-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: white;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.worker-demo-card:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		transform: translateX(2px);
	}

	.selected-card {
		background: #eff6ff;
		border-color: #3b82f6;
	}

	.wdc-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.wdc-info {
		flex: 1;
		min-width: 0;
	}

	.wdc-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.wdc-role {
		font-size: 0.725rem;
		color: var(--text-muted);
	}

	.wdc-user {
		font-size: 0.7rem;
		color: #64748b;
	}

	.wdc-user code {
		background: #f1f5f9;
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
		color: #0f172a;
	}

	.wdc-go {
		color: var(--primary);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.empty-text {
		text-align: center;
		padding: 1.5rem 0;
		font-size: 0.85rem;
	}
</style>
