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
		<!-- Mobile Topbar Header (Visible on Mobile/Tablet < 1024px) -->
		<header class="mobile-topbar mobile-only no-print">
			<button 
				type="button" 
				class="mobile-menu-btn" 
				onclick={toggleMenu} 
				aria-label={mobileMenuOpen ? 'Tutup Menu Navigasi' : 'Buka Menu Navigasi'}
				aria-expanded={mobileMenuOpen}
			>
				{#if mobileMenuOpen}
					✕
				{:else}
					☰
				{/if}
			</button>

			<a href={data.user.role === 'ADMIN' ? '/admin' : '/absen'} class="mobile-brand">
				<div class="logo-box logo-box-sm">🔨</div>
				<span class="brand-title">AbsenPak</span>
				<span class="brand-badge">{data.user.role}</span>
			</a>

			<div class="mobile-user-avatar" title={data.user.nama}>
				{data.user.nama.slice(0, 2).toUpperCase()}
			</div>
		</header>

		<!-- Backdrop Overlay for Mobile Drawer -->
		{#if mobileMenuOpen}
			<div 
				class="sidebar-backdrop mobile-only" 
				onclick={closeMenu} 
				role="presentation"
			></div>
		{/if}

		<!-- Sidebar Navigation -->
		<aside class="sidebar no-print" class:open={mobileMenuOpen}>
			<!-- Brand Area -->
			<div class="sidebar-header">
				<a href={data.user.role === 'ADMIN' ? '/admin' : '/absen'} class="brand" onclick={closeMenu}>
					<div class="logo-box">🔨</div>
					<div class="brand-info">
						<span class="brand-title">AbsenPak</span>
						<span class="brand-sub">Sistem Proyek</span>
					</div>
					<span class="brand-badge">{data.user.role}</span>
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
					{/if}
				</nav>
			</div>

			<!-- User Info & Logout at Bottom -->
			<div class="sidebar-footer">
				<div class="user-card">
					<div class="avatar">{data.user.nama.slice(0, 2).toUpperCase()}</div>
					<div class="user-meta">
						<span class="user-name" title={data.user.nama}>{data.user.nama}</span>
						<span class="user-sub">{data.user.nama_jabatan || data.user.role}</span>
					</div>
				</div>

				<form method="POST" action="/logout" class="logout-form">
					<button type="submit" class="logout-btn">
						<span class="logout-icon">🚪</span>
						<span>Keluar Akun</span>
					</button>
				</form>
			</div>
		</aside>
	{/if}

	<!-- Main Content Area -->
	<div class="main-wrapper">
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

	/* Logo Box */
	.logo-box {
		width: 36px;
		height: 36px;
		min-width: 36px;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.15rem;
		box-shadow: var(--shadow-sm);
	}

	.logo-box-sm {
		width: 32px;
		height: 32px;
		min-width: 32px;
		font-size: 1rem;
		border-radius: 7px;
	}

	/* Brand Badge */
	.brand-badge {
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* Mobile Topbar */
	.mobile-topbar {
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		z-index: 800;
		height: 60px;
		padding: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: env(safe-area-inset-top, 0px);
		padding-left: max(1rem, env(safe-area-inset-left, 0px));
		padding-right: max(1rem, env(safe-area-inset-right, 0px));
	}

	.mobile-menu-btn {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		width: 44px;
		height: 44px;
		min-width: 44px;
		min-height: 44px;
		border-radius: var(--radius-md);
		font-size: 1.3rem;
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

	.mobile-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.15rem;
		color: #0f172a;
	}

	.mobile-user-avatar {
		width: 32px;
		height: 32px;
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
		height: 68px;
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
		gap: 0.65rem;
		text-decoration: none;
		min-width: 0;
	}

	.brand-info {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}

	.brand-title {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.15rem;
		color: #0f172a;
		letter-spacing: -0.01em;
	}

	.brand-sub {
		font-size: 0.68rem;
		color: var(--text-muted);
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.sidebar-close-btn {
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		font-size: 1.1rem;
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
		padding: 1rem 0.85rem;
		border-top: 1px solid var(--border-subtle);
		background: #fafafa;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		flex-shrink: 0;
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.5rem 0.65rem;
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
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
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 0;
		overflow: hidden;
	}

	.user-name {
		font-size: 0.825rem;
		font-weight: 700;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-sub {
		font-size: 0.68rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.logout-form {
		width: 100%;
	}

	.logout-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid #fee2e2;
		background: #ffffff;
		color: #dc2626;
		font-size: 0.825rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.logout-btn:hover,
	.logout-btn:active {
		background: #fef2f2;
		border-color: #fca5a5;
		color: #b91c1c;
	}

	.logout-icon {
		font-size: 0.95rem;
	}

	/* Responsive Breakpoints */
	@media (min-width: 768px) {
		.mobile-only {
			display: none !important;
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
			display: flex;
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

		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	}

	/* Print styles */
	@media print {
		.sidebar,
		.mobile-topbar,
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
