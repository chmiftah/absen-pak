<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data, form }: PageProps = $props();

	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);

	function fillCredentials(u: string, p: string) {
		username = u;
		password = p;
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

		<form method="POST" class="login-form">
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

			<button type="submit" class="btn btn-primary btn-lg btn-full">
				Masuk Sekarang ➔
			</button>
		</form>

		<div class="daftar-footer">
			<span>Belum terdaftar? </span>
			<a href="/daftar" class="register-link">Daftar Karyawan Baru</a>
		</div>

		{#if data.demoUsers && data.demoUsers.length > 0}
			<div class="quick-demo-section">
				<div class="divider">
					<span>Klik Cepat Untuk Demo Akun</span>
				</div>
				<div class="quick-buttons-grid">
					{#each data.demoUsers as u}
						<button 
							type="button" 
							class="demo-btn {u.role === 'ADMIN' ? 'demo-admin' : ''}"
							onclick={() => fillCredentials(u.username, u.role === 'ADMIN' ? 'admin123' : '123456')}
						>
							<div class="demo-role">{u.role === 'ADMIN' ? '👑 Admin' : '👷 ' + (u.nama_jabatan || 'Tukang')}</div>
							<div class="demo-name">{u.nama}</div>
							<div class="demo-sub">User: {u.username}</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.login-wrapper {
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.login-card {
		background: white;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 2.25rem;
		width: 100%;
		max-width: 480px;
		box-shadow: var(--shadow-xl);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
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
		margin-bottom: 1rem;
		border: 1px solid #bfdbfe;
	}

	.login-header h1 {
		font-size: 1.75rem;
		color: #0f172a;
		margin-bottom: 0.35rem;
	}

	.login-header p {
		color: var(--text-muted);
		font-size: 0.9rem;
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

	.quick-demo-section {
		margin-top: 2rem;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin-bottom: 1rem;
	}

	.divider::before, .divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px dashed var(--border-strong);
	}

	.divider span {
		padding: 0 0.75rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.quick-buttons-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}

	.demo-btn {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-md);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.demo-btn:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		transform: translateY(-1px);
	}

	.demo-admin {
		background: #fffbeb;
		border-color: #fde68a;
	}

	.demo-admin:hover {
		background: #fef3c7;
		border-color: #f59e0b;
	}

	.demo-role {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.demo-name {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--text-main);
	}

	.demo-sub {
		font-size: 0.7rem;
		color: var(--text-light);
	}
</style>
