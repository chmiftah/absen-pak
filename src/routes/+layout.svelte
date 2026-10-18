<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types.js';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { data, children }: LayoutProps = $props();
	let mobileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js', {
				type: 'module'
			}).catch((err) => {
				console.warn('SW registration warning:', err);
			});
		}
	});
</script>

<svelte:head>
	<title>AbsenPak - Absensi & Penggajian Proyek</title>
</svelte:head>

<div class="app-layout">
	{#if data.user}
		<nav class="navbar no-print">
			<div class="container nav-container">
				<div class="brand-wrapper">
					<a href={data.user.role === 'ADMIN' ? '/admin' : '/absen'} class="brand">
						<div class="logo-box">🔨</div>
						<span>AbsenPak</span>
						<span class="brand-badge">{data.user.role}</span>
					</a>
				</div>

				<!-- Desktop Navigation -->
				<div class="nav-links desktop-only">
					{#if data.user.role === 'ADMIN'}
						<a href="/admin" class="nav-link {page.url.pathname === '/admin' ? 'active' : ''}">
							📊 Dashboard
						</a>
						<a href="/admin/proyek" class="nav-link {page.url.pathname.startsWith('/admin/proyek') ? 'active' : ''}">
							🏗️ Proyek
						</a>
						<a href="/admin/karyawan" class="nav-link {page.url.pathname.startsWith('/admin/karyawan') ? 'active' : ''}">
							👷 Karyawan & Rate
						</a>
						<a href="/admin/absen" class="nav-link {page.url.pathname.startsWith('/admin/absen') ? 'active' : ''}">
							📋 Rekap Absen
						</a>
						<a href="/admin/laporan" class="nav-link {page.url.pathname.startsWith('/admin/laporan') ? 'active' : ''}">
							💰 Laporan Penggajian
						</a>
					{:else}
						<a href="/absen" class="nav-link {page.url.pathname === '/absen' ? 'active' : ''}">
							✍️ Absen Hari Ini
						</a>
						<a href="/absen/riwayat" class="nav-link {page.url.pathname === '/absen/riwayat' ? 'active' : ''}">
							📅 Riwayat Saya
						</a>
					{/if}
				</div>

				<!-- User Info & Action -->
				<div class="user-action-area desktop-only">
					<div class="user-pill">
						<div class="avatar">{data.user.nama.slice(0, 2).toUpperCase()}</div>
						<div class="user-meta">
							<span class="user-name">{data.user.nama}</span>
							<span class="user-sub">{data.user.nama_jabatan || data.user.role}</span>
						</div>
					</div>
					<form method="POST" action="/logout">
						<button type="submit" class="btn btn-secondary btn-sm">Keluar</button>
					</form>
				</div>

				<!-- Mobile Toggle -->
				<button class="mobile-toggle-btn mobile-only" onclick={toggleMenu} aria-label="Toggle Menu">
					☰
				</button>
			</div>

			<!-- Mobile Menu Dropdown -->
			{#if mobileMenuOpen}
				<div class="mobile-drawer">
					<div class="mobile-user-card">
						<div class="avatar">{data.user.nama.slice(0, 2).toUpperCase()}</div>
						<div>
							<div class="user-name">{data.user.nama}</div>
							<div class="user-sub">{data.user.nama_jabatan || data.user.role}</div>
						</div>
					</div>

					<div class="mobile-nav-links">
						{#if data.user.role === 'ADMIN'}
							<a href="/admin" onclick={() => mobileMenuOpen = false} class="m-link">📊 Dashboard</a>
							<a href="/admin/proyek" onclick={() => mobileMenuOpen = false} class="m-link">🏗️ Data Proyek</a>
							<a href="/admin/karyawan" onclick={() => mobileMenuOpen = false} class="m-link">👷 Karyawan & Rate</a>
							<a href="/admin/absen" onclick={() => mobileMenuOpen = false} class="m-link">📋 Rekap Absen</a>
							<a href="/admin/laporan" onclick={() => mobileMenuOpen = false} class="m-link">💰 Laporan Penggajian</a>
						{:else}
							<a href="/absen" onclick={() => mobileMenuOpen = false} class="m-link">✍️ Absen Hari Ini</a>
							<a href="/absen/riwayat" onclick={() => mobileMenuOpen = false} class="m-link">📅 Riwayat & Gaji Saya</a>
						{/if}
					</div>

					<form method="POST" action="/logout" class="mobile-logout-form">
						<button type="submit" class="btn btn-danger btn-full">Keluar Akun</button>
					</form>
				</div>
			{/if}
		</nav>
	{/if}

	<main class="page-body">
		{@render children()}
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.page-body {
		flex: 1;
		padding-top: 1.5rem;
		padding-bottom: 3rem;
	}

	.logo-box {
		width: 32px;
		height: 32px;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
	}

	.user-action-area {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-pill {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		padding: 0.3rem 0.75rem 0.3rem 0.4rem;
		border-radius: 9999px;
	}

	.avatar {
		width: 28px;
		height: 28px;
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}

	.user-name {
		font-size: 0.825rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.user-sub {
		font-size: 0.68rem;
		color: var(--text-muted);
	}

	.desktop-only { display: flex; }
	.mobile-only { display: none; }

	.mobile-toggle-btn {
		background: none;
		border: 1px solid var(--border-subtle);
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.mobile-drawer {
		background: white;
		border-bottom: 2px solid var(--border-subtle);
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mobile-user-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-subtle);
		border-radius: var(--radius-md);
	}

	.mobile-nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.m-link {
		padding: 0.65rem 0.85rem;
		font-weight: 600;
		border-radius: var(--radius-md);
		color: var(--text-main);
		background: #f8fafc;
	}

	.m-link:hover {
		background: var(--primary-light);
		color: var(--primary);
	}

	@media (max-width: 860px) {
		.desktop-only { display: none !important; }
		.mobile-only { display: block !important; }
	}
</style>
