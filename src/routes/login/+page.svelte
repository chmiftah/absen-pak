<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isSubmitting = $state(false);

	// Demo project selection (0 for Semua Pekerja)
	let selectedProjekId = $state<number>(0);
	let searchQuery = $state('');

	// Filter workers based on selected project and search query
	let currentWorkers = $derived(
		data.projectWorkers
			.filter((w) => selectedProjekId === 0 || Number(w.projek_id) === Number(selectedProjekId))
			.filter((w) => {
				if (!searchQuery.trim()) return true;
				const q = searchQuery.toLowerCase().trim();
				return (
					(w.nama && w.nama.toLowerCase().includes(q)) ||
					(w.username && w.username.toLowerCase().includes(q)) ||
					(w.nama_jabatan && w.nama_jabatan.toLowerCase().includes(q))
				);
			})
			.sort((a, b) => {
				const aIsWakidi = a.username?.toLowerCase() === 'wakidi' || a.nama?.toLowerCase().includes('wakidi');
				const bIsWakidi = b.username?.toLowerCase() === 'wakidi' || b.nama?.toLowerCase().includes('wakidi');
				if (aIsWakidi && !bIsWakidi) return -1;
				if (!aIsWakidi && bIsWakidi) return 1;
				return (a.nama || '').localeCompare(b.nama || '');
			})
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

	import { onMount } from 'svelte';

	let deferredPrompt = $state<any>(null);
	let isStandalone = $state(false);
	let canInstall = $state(false);
	let showIosModal = $state(false);
	let isIos = $state(false);

	onMount(() => {
		const isStandaloneMode = 
			window.matchMedia('(display-mode: standalone)').matches || 
			(window.navigator as any).standalone === true;

		isStandalone = isStandaloneMode;
		isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

		// Show install button if not already in standalone mode
		if (!isStandaloneMode) {
			canInstall = true;
		}

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			canInstall = true;
		});

		window.addEventListener('appinstalled', () => {
			canInstall = false;
			deferredPrompt = null;
		});
	});

	async function handleInstallClick() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const choice = await deferredPrompt.userChoice;
			if (choice.outcome === 'accepted') {
				canInstall = false;
			}
			deferredPrompt = null;
		} else {
			// Jika di iOS Safari atau browser tanpa direct prompt
			showIosModal = true;
		}
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

			<!-- Project Filter Selector -->
			<div class="proj-selector-header">
				<span class="ps-title">🏗️ Pilih Proyek / Semua Akun:</span>
			</div>

			<div class="project-pill-list">
				<button
					type="button"
					class="proj-pill {selectedProjekId === 0 ? 'active' : ''}"
					onclick={() => selectedProjekId = 0}
				>
					<strong>🌐 Semua Pekerja</strong>
					<small>{data.projectWorkers.length} Akun</small>
				</button>
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
					<span>
						{#if selectedProjekId === 0}
							Semua Akun Pekerja Terdaftar ({currentWorkers.length}):
						{:else}
							Pekerja di Proyek <strong>{activeProjectObj?.nama_projek}</strong> ({currentWorkers.length}):
						{/if}
					</span>
					<small class="text-muted">Password: <code>123456</code></small>
				</div>

				<div class="wdb-search-box">
					<input
						type="text"
						class="wdb-search-input"
						placeholder="🔍 Cari nama atau username pekerja..."
						bind:value={searchQuery}
					/>
				</div>

				{#if currentWorkers.length === 0}
					<p class="text-muted empty-text">Tidak ada akun pekerja yang cocok.</p>
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
									<div class="wdc-role">
										{w.nama_jabatan || 'Tukang'}
										{#if selectedProjekId === 0 && w.nama_projek}
											<span class="wdc-badge">{w.nama_projek}</span>
										{/if}
										• {formatRupiah(w.rate_harian)}
									</div>
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

{#if canInstall && !isStandalone}
	<div class="floating-install-container">
		<button
			type="button"
			class="btn-floating-install"
			onclick={handleInstallClick}
			aria-label="Install Aplikasi AbsenPak di HP"
		>
			<span class="pwa-icon-wrap">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
					<line x1="12" y1="18" x2="12.01" y2="18"></line>
				</svg>
				<span class="pwa-pulse-dot"></span>
			</span>
			<span class="pwa-label">
				<strong>Install di HP</strong>
				<small>Aplikasi Absensi</small>
			</span>
			<span class="pwa-download-arrow">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="7 10 12 15 17 10"/>
					<line x1="12" y1="15" x2="12" y2="3"/>
				</svg>
			</span>
		</button>
	</div>
{/if}

{#if showIosModal}
	<div 
		class="pwa-modal-backdrop" 
		onclick={(e) => { if (e.target === e.currentTarget) showIosModal = false; }} 
		onkeydown={(e) => { if (e.key === 'Escape') showIosModal = false; }}
		role="presentation"
	>
		<div class="pwa-modal-card" role="dialog" aria-modal="true" tabindex="-1">
			<div class="pwa-modal-header">
				<div class="pwa-modal-icon">📲</div>
				<div>
					<h3 class="pwa-modal-title">Pasang AbsenPak di HP</h3>
					<p class="pwa-modal-subtitle">Gunakan layaknya aplikasi mobile tanpa buka browser lagi</p>
				</div>
				<button type="button" class="pwa-modal-close" onclick={() => (showIosModal = false)} aria-label="Tutup">✕</button>
			</div>

			<div class="pwa-modal-body">
				{#if isIos}
					<div class="pwa-step-list">
						<div class="pwa-step-item">
							<div class="pwa-step-number">1</div>
							<div class="pwa-step-text">
								Buka web ini menggunakan browser <strong>Safari</strong> di iPhone/iPad.
							</div>
						</div>
						<div class="pwa-step-item">
							<div class="pwa-step-number">2</div>
							<div class="pwa-step-text">
								Ketuk tombol <strong>Bagikan (Share)</strong>
								<span class="pwa-share-badge">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
										<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
										<polyline points="16 6 12 2 8 6"/>
										<line x1="12" y1="2" x2="12" y2="15"/>
									</svg>
								</span> di bagian bawah layar.
							</div>
						</div>
						<div class="pwa-step-item">
							<div class="pwa-step-number">3</div>
							<div class="pwa-step-text">
								Gulir ke bawah lalu pilih menu <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> ➕.
							</div>
						</div>
						<div class="pwa-step-item">
							<div class="pwa-step-number">4</div>
							<div class="pwa-step-text">
								Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon aplikasi AbsenPak siap digunakan!
							</div>
						</div>
					</div>
				{:else}
					<div class="pwa-step-list">
						<div class="pwa-step-item">
							<div class="pwa-step-number">1</div>
							<div class="pwa-step-text">
								Buka menu browser dengan mengetuk tombol <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.
							</div>
						</div>
						<div class="pwa-step-item">
							<div class="pwa-step-number">2</div>
							<div class="pwa-step-text">
								Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
							</div>
						</div>
						<div class="pwa-step-item">
							<div class="pwa-step-number">3</div>
							<div class="pwa-step-text">
								Konfirmasi pemasangan. Aplikasi akan langsung terpasang di HP Anda!
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="pwa-modal-footer">
				<button type="button" class="btn btn-primary pwa-btn-done" onclick={() => (showIosModal = false)}>
					Saya Mengerti
				</button>
			</div>
		</div>
	</div>
{/if}

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

	.wdb-search-box {
		margin-bottom: 0.75rem;
	}

	.wdb-search-input {
		width: 100%;
		padding: 0.45rem 0.75rem;
		font-size: 0.8rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		background: white;
		outline: none;
		transition: border-color var(--transition-fast);
	}

	.wdb-search-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
	}

	.wdc-badge {
		display: inline-block;
		background: #eff6ff;
		color: #1d4ed8;
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
		font-size: 0.675rem;
		font-weight: 600;
		border: 1px solid #bfdbfe;
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

	/* Floating PWA Install Button */
	.floating-install-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 1000;
		pointer-events: auto;
	}

	.btn-floating-install {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.35);
		border-radius: 9999px;
		padding: 0.55rem 1rem 0.55rem 0.65rem;
		box-shadow: 0 10px 25px -4px rgba(37, 99, 235, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-family: var(--font-sans);
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
		animation: pwa-float-bounce 4s ease-in-out infinite;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-floating-install:hover {
		transform: translateY(-3px) scale(1.02);
		box-shadow: 0 14px 28px -3px rgba(37, 99, 235, 0.6), 0 6px 10px -3px rgba(0, 0, 0, 0.15);
	}

	.btn-floating-install:active {
		transform: translateY(0) scale(0.97);
	}

	.pwa-icon-wrap {
		position: relative;
		width: 38px;
		height: 38px;
		background: rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(4px);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		flex-shrink: 0;
	}

	.pwa-pulse-dot {
		position: absolute;
		top: 1px;
		right: 1px;
		width: 9px;
		height: 9px;
		background: #22c55e;
		border-radius: 50%;
		border: 2px solid #1e40af;
		box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8);
		animation: pwa-pulse 2s infinite;
	}

	.pwa-label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		line-height: 1.15;
	}

	.pwa-label strong {
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: #ffffff;
	}

	.pwa-label small {
		font-size: 0.68rem;
		font-weight: 500;
		color: #dbeafe;
	}

	.pwa-download-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		background: rgba(255, 255, 255, 0.22);
		border-radius: 50%;
		color: #ffffff;
		flex-shrink: 0;
		margin-left: 0.15rem;
	}

	@keyframes pwa-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8);
		}
		70% {
			box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
		}
	}

	@keyframes pwa-float-bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	/* Modal Guide for iOS / Manual Install */
	.pwa-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.65);
		backdrop-filter: blur(5px);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		animation: pwa-fade-in 0.2s ease-out;
	}

	.pwa-modal-card {
		background: #ffffff;
		border-radius: var(--radius-xl);
		max-width: 440px;
		width: 100%;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		border: 1px solid var(--border-subtle);
		animation: pwa-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.pwa-modal-header {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
		margin-bottom: 1.25rem;
	}

	.pwa-modal-icon {
		font-size: 2rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.pwa-modal-title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-main);
		margin-bottom: 0.25rem;
		letter-spacing: -0.01em;
	}

	.pwa-modal-subtitle {
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.35;
	}

	.pwa-modal-close {
		margin-left: auto;
		background: none;
		border: none;
		font-size: 1.2rem;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}

	.pwa-modal-close:hover {
		background: var(--bg-subtle);
		color: var(--text-main);
	}

	.pwa-step-list {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.pwa-step-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: var(--text-main);
		line-height: 1.45;
	}

	.pwa-step-number {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #eff6ff;
		color: #2563eb;
		font-weight: 700;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.1rem;
		border: 1px solid #bfdbfe;
	}

	.pwa-step-text {
		flex: 1;
	}

	.pwa-step-text strong {
		color: #0f172a;
	}

	.pwa-share-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
		background: #e2e8f0;
		border-radius: 4px;
		padding: 2px 5px;
		margin: 0 2px;
		color: #0284c7;
	}

	.pwa-modal-footer {
		display: flex;
		justify-content: flex-end;
	}

	.pwa-btn-done {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: var(--radius-md);
	}

	@keyframes pwa-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes pwa-slide-up {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 640px) {
		.floating-install-container {
			bottom: 1.25rem;
			right: 1rem;
		}

		.btn-floating-install {
			padding: 0.5rem 0.85rem 0.5rem 0.55rem;
			gap: 0.6rem;
		}

		.pwa-icon-wrap {
			width: 34px;
			height: 34px;
		}

		.pwa-label strong {
			font-size: 0.8rem;
		}

		.pwa-label small {
			font-size: 0.65rem;
		}
	}
</style>
