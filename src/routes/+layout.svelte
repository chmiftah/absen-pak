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

	function closeMenu() {
		mobileMenuOpen = false;
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

<div class="app-layout" class:has-sidebar={!!data.user}>
	{#if data.user}
		<!-- Backdrop Overlay for Mobile Drawer -->
		{#if mobileMenuOpen}
			<div 
				class="sidebar-backdrop mobile-only" 
				onclick={closeMenu} 
				role="presentation"
			></div>
		{/if}

		<!-- Sidebar Navigation (Left) -->
		<aside class="sidebar no-print" class:open={mobileMenuOpen}>
			<!-- Brand Area -->
			<div class="sidebar-header">
				<a href={data.user.role === 'ADMIN' ? '/admin' : '/absen'} class="brand" onclick={closeMenu}>
					<div class="brand-icon-box">🔨</div>
					<div class="brand-text">
						<span class="brand-title">AbsenPak</span>
						<span class="brand-sub">{data.user.role === 'ADMIN' ? 'Portal Admin' : 'Portal Pekerja'}</span>
					</div>
				</a>

				<button 
					type="button" 
					class="sidebar-close-btn mobile-only" 
					onclick={closeMenu} 
					aria-label="Tutup Sidebar"
				>✕</button>
			</div>

			<!-- Navigation Links -->
			<div class="sidebar-nav-container">
				<div class="nav-section-label">
					{data.user.role === 'ADMIN' ? 'Menu Administrator' : 'Menu Pekerja'}
				</div>

				<nav class="sidebar-nav">
					{#if data.user.role === 'ADMIN'}
						<a 
							href="/admin" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname === '/admin' ? 'active' : ''}"
						>
							<span class="nav-icon">📊</span>
							<span class="nav-text">Dashboard</span>
						</a>
						<a 
							href="/admin/proyek" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname.startsWith('/admin/proyek') ? 'active' : ''}"
						>
							<span class="nav-icon">🏗️</span>
							<span class="nav-text">Data Proyek</span>
						</a>
						<a 
							href="/admin/karyawan" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname.startsWith('/admin/karyawan') ? 'active' : ''}"
						>
							<span class="nav-icon">👷</span>
							<span class="nav-text">Karyawan & Rate</span>
						</a>
						<a 
							href="/admin/absen" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname.startsWith('/admin/absen') ? 'active' : ''}"
						>
							<span class="nav-icon">📋</span>
							<span class="nav-text">Rekap Absen</span>
						</a>
						<a 
							href="/admin/laporan" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname.startsWith('/admin/laporan') ? 'active' : ''}"
						>
							<span class="nav-icon">💰</span>
							<span class="nav-text">Laporan Penggajian</span>
						</a>
						<a 
							href="/profile" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname === '/profile' ? 'active' : ''}"
						>
							<span class="nav-icon">👤</span>
							<span class="nav-text">Profil Saya</span>
						</a>
					{:else}
						<a 
							href="/absen" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname === '/absen' ? 'active' : ''}"
						>
							<span class="nav-icon">✍️</span>
							<span class="nav-text">Absen Hari Ini</span>
						</a>
						<a 
							href="/absen/riwayat" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname === '/absen/riwayat' ? 'active' : ''}"
						>
							<span class="nav-icon">📅</span>
							<span class="nav-text">Riwayat & Gaji Saya</span>
						</a>
						<a 
							href="/profile" 
							onclick={closeMenu} 
							class="sidebar-link {page.url.pathname === '/profile' ? 'active' : ''}"
						>
							<span class="nav-icon">👤</span>
							<span class="nav-text">Profil Saya</span>
						</a>
					{/if}
				</nav>
			</div>

			<!-- Mobile Drawer Extra: Logout in Drawer -->
			<div class="sidebar-drawer-footer mobile-only">
				<form method="POST" action="/logout" class="drawer-logout-form">
					<button type="submit" class="drawer-logout-btn">
						<span>🚪 Keluar Akun</span>
					</button>
				</form>
			</div>

			<!-- Desktop Sidebar Footer -->
			<div class="sidebar-footer desktop-only">
				<div class="system-status">
					<span class="status-dot"></span>
					<span class="status-text">Sistem Siap & Online</span>
				</div>
			</div>
		</aside>
	{/if}

	<!-- Main Content Area -->
	<div class="main-wrapper">
		{#if data.user}
			<!-- Top Navbar with Profile in the Top-Right Corner -->
			<header class="top-navbar no-print">
				<div class="topbar-left">
					<!-- Mobile menu button (< 768px) -->
					<button 
						type="button" 
						class="mobile-menu-btn mobile-only" 
						onclick={toggleMenu} 
						aria-label={mobileMenuOpen ? 'Tutup Menu Navigasi' : 'Buka Menu Navigasi'}
						aria-expanded={mobileMenuOpen}
					>
						{#if mobileMenuOpen}✕{:else}☰{/if}
					</button>

					<!-- Mobile Brand Title -->
					<div class="mobile-brand-box mobile-only">
						<div class="brand-icon-box brand-icon-box-sm">🔨</div>
						<span class="mobile-brand-name">AbsenPak</span>
					</div>

					<!-- Desktop Page Breadcrumb -->
					<div class="topbar-breadcrumb desktop-only">
						<span class="breadcrumb-pill {data.user.role === 'ADMIN' ? 'pill-admin' : 'pill-worker'}">
							<span class="pill-dot"></span>
							<span>{data.user.role === 'ADMIN' ? 'Admin' : 'Pekerja'}</span>
						</span>
						<span class="breadcrumb-sep">/</span>
						<span class="breadcrumb-current">
							{#if page.url.pathname === '/admin'}Dashboard Ringkasan
							{:else if page.url.pathname.startsWith('/admin/proyek')}Data & Lokasi Proyek
							{:else if page.url.pathname.startsWith('/admin/karyawan')}Master Karyawan & Tarif
							{:else if page.url.pathname.startsWith('/admin/absen')}Rekapitulasi Absensi
							{:else if page.url.pathname.startsWith('/admin/laporan')}Matrix Laporan Gaji
							{:else if page.url.pathname === '/absen'}Absensi Mandiri
							{:else if page.url.pathname.startsWith('/absen/riwayat')}Riwayat & Rincian Upah
							{:else if page.url.pathname === '/profile'}Profil Pengguna
							{:else}Panel Kendali
							{/if}
						</span>
					</div>
				</div>

				<!-- Pojok Kanan Atas: Profil Pengguna & Tombol Keluar -->
				<div class="topbar-right">
					<a href="/profile" class="user-profile-btn {page.url.pathname === '/profile' ? 'active-profile' : ''}" title="Buka Profil Saya">
						<div class="avatar-box">
							<div class="avatar">{data.user.nama.slice(0, 2).toUpperCase()}</div>
							<span class="status-indicator"></span>
						</div>
						<div class="user-meta">
							<span class="user-name" title={data.user.nama}>{data.user.nama}</span>
							<span class="user-sub">{data.user.nama_jabatan || (data.user.role === 'ADMIN' ? 'Administrator' : 'Karyawan')}</span>
						</div>
						<span class="profile-arrow desktop-only" aria-hidden="true">
							<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
								<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
							</svg>
						</span>
					</a>

					<div class="topbar-divider"></div>

					<form method="POST" action="/logout" class="topbar-logout-form">
						<button type="submit" class="logout-btn" title="Keluar dari akun">
							<svg class="logout-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
								<polyline points="16 17 21 12 16 7"></polyline>
								<line x1="21" y1="12" x2="9" y2="12"></line>
							</svg>
							<span class="logout-text desktop-only">Keluar</span>
						</button>
					</form>
				</div>
			</header>
		{/if}

		<main class="page-body">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-main);
	}

	.main-wrapper {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.page-body {
		flex: 1;
		padding-top: 1.5rem;
		padding-bottom: 3rem;
	}

	/* Top Navbar across the top */
	.top-navbar {
		height: 64px;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		padding-top: env(safe-area-inset-top, 0px);
		padding-left: max(1.25rem, env(safe-area-inset-left, 0px));
		padding-right: max(1.25rem, env(safe-area-inset-right, 0px));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		min-width: 0;
	}

	/* Breadcrumb Navigation */
	.topbar-breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.breadcrumb-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.breadcrumb-pill.pill-admin {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}

	.breadcrumb-pill.pill-worker {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.pill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.pill-admin .pill-dot {
		background: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.pill-worker .pill-dot {
		background: #16a34a;
		box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
	}

	.breadcrumb-sep {
		color: #cbd5e1;
		font-weight: 400;
		font-size: 0.85rem;
	}

	.breadcrumb-current {
		color: var(--text-main);
		font-weight: 600;
		font-size: 0.88rem;
		letter-spacing: -0.01em;
	}

	.mobile-brand-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-brand-name {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.15rem;
		color: #0f172a;
	}

	/* Pojok Kanan Atas: User Profile & Logout */
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.user-profile-btn {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		padding: 0.3rem 0.65rem 0.3rem 0.45rem;
		border-radius: var(--radius-md);
		transition: all 0.15s ease;
		text-decoration: none;
		cursor: pointer;
		height: 42px;
	}

	.user-profile-btn:hover {
		border-color: #cbd5e1;
		background: #f8fafc;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.user-profile-btn.active-profile {
		border-color: #93c5fd;
		background: #eff6ff;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
	}

	.avatar-box {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.avatar {
		width: 32px;
		height: 32px;
		min-width: 32px;
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
	}

	.status-indicator {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 9px;
		height: 9px;
		background: #10b981;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		min-width: 0;
	}

	.user-name {
		font-size: 0.825rem;
		font-weight: 700;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 130px;
	}

	.user-sub {
		font-size: 0.68rem;
		color: var(--text-muted);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 130px;
	}

	.profile-arrow {
		color: #94a3b8;
		display: flex;
		align-items: center;
		transition: transform 0.15s ease, color 0.15s ease;
	}

	.user-profile-btn:hover .profile-arrow {
		color: var(--primary);
		transform: translateX(1px);
	}

	.topbar-divider {
		width: 1px;
		height: 24px;
		background: var(--border-subtle);
		margin: 0 0.15rem;
	}

	.topbar-logout-form {
		margin: 0;
	}

	.logout-btn {
		height: 42px;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0 0.85rem;
		font-size: 0.825rem;
		font-weight: 600;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: #ffffff;
		color: #64748b;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.logout-icon {
		flex-shrink: 0;
		color: #94a3b8;
		transition: color 0.15s ease;
	}

	.logout-btn:hover {
		background: #fef2f2;
		color: #dc2626;
		border-color: #fca5a5;
		box-shadow: 0 1px 3px rgba(220, 38, 38, 0.08);
	}

	.logout-btn:hover .logout-icon {
		color: #dc2626;
	}

	.mobile-menu-btn {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		width: 40px;
		height: 40px;
		min-width: 40px;
		min-height: 40px;
		border-radius: var(--radius-md);
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #0f172a;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition: all 0.15s ease;
	}

	.mobile-menu-btn:active {
		background: #eff6ff;
		border-color: #93c5fd;
		color: #2563eb;
	}

	/* Brand Icon Box */
	.brand-icon-box {
		width: 38px;
		height: 38px;
		min-width: 38px;
		background: linear-gradient(135deg, #eff6ff, #dbeafe);
		border: 1px solid #bfdbfe;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.15rem;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.08);
	}

	.brand-icon-box-sm {
		width: 32px;
		height: 32px;
		min-width: 32px;
		font-size: 1rem;
		border-radius: 8px;
	}

	/* Sidebar Structure */
	.sidebar {
		background: #ffffff;
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		width: 250px;
		min-width: 250px;
		max-width: 250px;
		position: sticky;
		top: 0;
		height: 100vh;
		z-index: 100;
		box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
		padding-top: env(safe-area-inset-top, 0px);
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.sidebar-header {
		height: 64px;
		padding: 0 1.25rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.sidebar-header .brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		min-width: 0;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}

	.brand-title {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.15rem;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.brand-sub {
		font-size: 0.68rem;
		color: #64748b;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.sidebar-close-btn {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		width: 34px;
		height: 34px;
		border-radius: var(--radius-sm);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #64748b;
		transition: all 0.15s ease;
	}

	.sidebar-close-btn:active {
		background: #fee2e2;
		color: #dc2626;
		border-color: #fca5a5;
	}

	/* Nav List */
	.sidebar-nav-container {
		flex: 1;
		overflow-y: auto;
		padding: 1.1rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		-webkit-overflow-scrolling: touch;
	}

	.nav-section-label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-light);
		padding: 0.4rem 0.65rem 0.35rem;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.85rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.88rem;
		color: #475569;
		text-decoration: none;
		transition: all 0.15s ease;
		border-left: 3px solid transparent;
	}

	.sidebar-link .nav-icon {
		font-size: 1.15rem;
		width: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.sidebar-link .nav-text {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-link:hover {
		background: #f8fafc;
		color: var(--primary);
		transform: translateX(2px);
	}

	.sidebar-link.active {
		background: var(--primary-light);
		color: var(--primary);
		border-left-color: var(--primary);
		font-weight: 700;
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: 0.85rem 1rem;
		border-top: 1px solid var(--border-subtle);
		background: #fafafa;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.system-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 0 2px #d1fae5;
	}

	.sidebar-drawer-footer {
		padding: 1rem 0.85rem;
		border-top: 1px solid var(--border-subtle);
		background: #fafafa;
	}

	.drawer-logout-btn {
		width: 100%;
		padding: 0.65rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid #fee2e2;
		background: #ffffff;
		color: #dc2626;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}

	/* Responsive Breakpoints */
	@media (min-width: 768px) {
		.mobile-only {
			display: none !important;
		}

		.desktop-only {
			display: flex !important;
		}

		.app-layout.has-sidebar {
			flex-direction: row;
		}

		.sidebar {
			position: sticky;
			top: 0;
			height: 100vh;
			transform: none !important;
			box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02) !important;
		}

		.main-wrapper {
			min-width: 0;
		}
	}

	@media (max-width: 767px) {
		.mobile-only {
			display: flex !important;
		}

		.desktop-only {
			display: none !important;
		}

		.app-layout.has-sidebar {
			flex-direction: column;
		}

		.sidebar {
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			bottom: 0 !important;
			height: 100vh !important;
			width: 280px !important;
			max-width: 85vw !important;
			z-index: 1000 !important;
			transform: translateX(-100%);
			transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
			box-shadow: none;
		}

		.sidebar.open {
			transform: translateX(0);
			box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;
		}

		.sidebar-backdrop {
			position: fixed;
			inset: 0;
			background: rgba(15, 23, 42, 0.5);
			backdrop-filter: blur(3px);
			-webkit-backdrop-filter: blur(3px);
			z-index: 999;
			animation: fadeIn 0.2s ease;
		}

		.user-sub {
			display: none;
		}

		.user-name {
			max-width: 90px;
		}

		.user-profile-btn {
			height: 38px;
			padding: 0.25rem 0.55rem 0.25rem 0.35rem;
			gap: 0.5rem;
		}

		.topbar-right {
			gap: 0.4rem;
		}

		.logout-btn {
			height: 38px;
			width: 38px;
			padding: 0;
			justify-content: center;
		}

		.topbar-divider {
			height: 20px;
		}

		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	}

	/* Print styles */
	@media print {
		.sidebar,
		.top-navbar,
		.sidebar-backdrop,
		.no-print {
			display: none !important;
		}

		.app-layout {
			display: block !important;
			background: white !important;
		}

		.main-wrapper {
			margin: 0 !important;
			padding: 0 !important;
			width: 100% !important;
		}

		.page-body {
			padding: 0 !important;
		}
	}
</style>
