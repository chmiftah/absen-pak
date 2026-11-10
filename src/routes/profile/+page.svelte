<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import { formatIndoDate } from '$lib/dateUtils';

	let { data, form }: PageProps = $props();

	let activeTab = $state<'dashboard' | 'edit' | 'security'>('dashboard');
	let isSubmitting = $state(false);

	let inputNama = $state(data.userProfile.nama || '');
	let inputUsername = $state(data.userProfile.username || '');
	let inputNoHp = $state(data.userProfile.no_hp || '');

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);

	function formatRupiah(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}
</script>

<svelte:head>
	<title>Profil & Dashboard Pengguna - AbsenPak</title>
</svelte:head>

<div class="container profile-page">
	<!-- Page Top Breadcrumbs & Header -->
	<div class="page-top">
		<div>
			<a href={data.userProfile.role === 'ADMIN' ? '/admin' : '/absen'} class="back-link">
				← Kembali ke {data.userProfile.role === 'ADMIN' ? 'Dashboard Admin' : 'Absensi'}
			</a>
			<h1>Profil & Pengaturan Akun</h1>
			<p>Kelola data akun, informasi profil pengguna, dan ringkasan aktivitas proyek Anda</p>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if form?.success}
		<div class="alert-success">
			<span class="alert-icon">✅</span>
			<div>
				<strong>Berhasil!</strong>
				<p>{form.message}</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert-error">
			<span class="alert-icon">⚠️</span>
			<div>
				<strong>Terjadi Kesalahan:</strong>
				<p>{form.error}</p>
			</div>
		</div>
	{/if}

	<!-- Hero Card: Profile Overview -->
	<div class="card profile-hero-card">
		<div class="profile-hero-content">
			<div class="hero-avatar">
				{data.userProfile.nama.slice(0, 2).toUpperCase()}
			</div>

			<div class="hero-details">
				<div class="hero-name-row">
					<h2>{data.userProfile.nama}</h2>
					<span class="role-pill {data.userProfile.role === 'ADMIN' ? 'role-admin' : 'role-worker'}">
						{data.userProfile.role === 'ADMIN' ? '👑 Administrator' : '👷 Pekerja'}
					</span>
					{#if data.userProfile.status_aktif !== false}
						<span class="status-pill status-active">Aktif</span>
					{/if}
				</div>

				<div class="hero-meta-grid">
					<div class="meta-item">
						<span class="meta-label">Username:</span>
						<span class="meta-val font-mono">@{data.userProfile.username}</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Jabatan:</span>
						<span class="meta-val">{data.userProfile.nama_jabatan || (data.userProfile.role === 'ADMIN' ? 'Admin Proyek' : 'Staf')}</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Lokasi Proyek:</span>
						<span class="meta-val">{data.userProfile.nama_projek ? `${data.userProfile.nama_projek}` : 'Semua Proyek (Umum)'}</span>
					</div>

					{#if data.userProfile.no_hp}
						<div class="meta-item">
							<span class="meta-label">WhatsApp:</span>
							<span class="meta-val">{data.userProfile.no_hp}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Navigation Tabs -->
		<div class="profile-tabs">
			<button 
				type="button" 
				class="tab-btn {activeTab === 'dashboard' ? 'active' : ''}" 
				onclick={() => activeTab = 'dashboard'}
			>
				📊 Dashboard & Ringkasan
			</button>
			<button 
				type="button" 
				class="tab-btn {activeTab === 'edit' ? 'active' : ''}" 
				onclick={() => activeTab = 'edit'}
			>
				✍️ Ubah Data Diri
			</button>
			<button 
				type="button" 
				class="tab-btn {activeTab === 'security' ? 'active' : ''}" 
				onclick={() => activeTab = 'security'}
			>
				🔒 Keamanan & Sandi
			</button>
		</div>
	</div>

	<!-- TAB 1: DASHBOARD & RINGKASAN -->
	{#if activeTab === 'dashboard'}
		<div class="tab-panel">
			{#if data.userProfile.role === 'ADMIN'}
				<!-- Admin Stats Grid -->
				<div class="stats-grid">
					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Proyek Konstruksi</span>
							<span class="stat-icon">🏗️</span>
						</div>
						<div class="stat-number">{data.adminStats?.totalProjects || 0} <small>Aktif</small></div>
						<div class="stat-desc">Lokasi proyek sedang dikerjakan</div>
					</div>

					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Tenaga Kerja</span>
							<span class="stat-icon">👥</span>
						</div>
						<div class="stat-number">{data.adminStats?.totalEmployees || 0} <small>Orang</small></div>
						<div class="stat-desc">Pekerja terdaftar berstatus aktif</div>
					</div>

					<div class="card stat-card stat-accent">
						<div class="stat-top">
							<span class="stat-title">Absensi Hari Ini</span>
							<span class="stat-icon">⚡</span>
						</div>
						<div class="stat-number">{data.adminStats?.todayAttendances || 0} <small>Tercatat</small></div>
						<div class="stat-desc">Per tanggal {formatIndoDate(data.todayStr)}</div>
					</div>

					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Total Bulan Ini</span>
							<span class="stat-icon">📋</span>
						</div>
						<div class="stat-number">{data.adminStats?.monthAttendances || 0} <small>Kali</small></div>
						<div class="stat-desc">Akumulasi presensi bulan berjalan</div>
					</div>
				</div>

				<!-- Quick Admin Links -->
				<div class="card quick-actions-card">
					<h3>⚡ Pintasan Menu Administrator</h3>
					<div class="quick-btn-grid">
						<a href="/admin/absen" class="quick-link">
							<span class="quick-icon">📋</span>
							<div>
								<strong>Rekap Absen Harian</strong>
								<p>Tinjau dan verifikasi absen lapangan</p>
							</div>
						</a>

						<a href="/admin/laporan" class="quick-link">
							<span class="quick-icon">💰</span>
							<div>
								<strong>Matrix Penggajian</strong>
								<p>Hitung upah mingguan & cetak PDF</p>
							</div>
						</a>

						<a href="/admin/karyawan" class="quick-link">
							<span class="quick-icon">👷</span>
							<div>
								<strong>Master Karyawan</strong>
								<p>Kelola data tukang & tarif harian</p>
							</div>
						</a>

						<a href="/admin/proyek" class="quick-link">
							<span class="quick-icon">🏗️</span>
							<div>
								<strong>Data Proyek</strong>
								<p>Tambah & pantau status proyek</p>
							</div>
						</a>
					</div>
				</div>

				<!-- Recent Attendance Activities -->
				<div class="card table-card">
					<div class="card-header-flex">
						<div>
							<h3>Aktivitas Absensi Terbaru di Lapangan</h3>
							<p class="card-subtitle">Data presensi mandiri dan input pengawas terakhir</p>
						</div>
						<a href="/admin/absen" class="btn btn-secondary btn-sm">Lihat Semua Absen ➔</a>
					</div>

					{#if data.recentActivities.length === 0}
						<div class="empty-state">
							<p>Belum ada rekaman absensi hari ini.</p>
						</div>
					{:else}
						<div class="table-responsive">
							<table class="data-table">
								<thead>
									<tr>
										<th>Tanggal</th>
										<th>Nama Pekerja</th>
										<th>Jabatan</th>
										<th>Lokasi Proyek</th>
										<th>Kehadiran</th>
										<th>Lembur Jam</th>
									</tr>
								</thead>
								<tbody>
									{#each data.recentActivities as a}
										<tr>
											<td><strong>{formatIndoDate(a.tanggal)}</strong></td>
											<td>{a.nama_karyawan}</td>
											<td><span class="badge badge-light">{a.nama_jabatan || '-'}</span></td>
											<td>{a.nama_projek}</td>
											<td>
												{#if Number(a.hadir_harian) === 1}
													<span class="badge badge-success">Penuh (1)</span>
												{:else if Number(a.hadir_harian) === 0.5}
													<span class="badge badge-warning">1/2 Hari</span>
												{:else}
													<span class="badge badge-danger">Absen / Libur</span>
												{/if}
											</td>
											<td>{Number(a.lembur_jam) > 0 ? `${a.lembur_jam} Jam` : '-'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

			{:else}
				<!-- WORKER DASHBOARD -->
				<!-- Today's Attendance Notification -->
				{#if data.todayCheckin}
					<div class="alert-success mb-4">
						<span class="alert-icon">🎉</span>
						<div>
							<strong>Anda sudah tercatat hadir hari ini! ({formatIndoDate(data.todayStr)})</strong>
							<p>Proyek: <strong>{data.todayCheckin.nama_projek}</strong> | Kehadiran: <strong>{Number(data.todayCheckin.hadir_harian) === 0.5 ? '1/2 Hari' : '1 Hari Penuh'}</strong> | Lembur: <strong>{data.todayCheckin.lembur_jam} Jam</strong></p>
						</div>
					</div>
				{:else}
					<div class="alert-info mb-4">
						<span class="alert-icon">⏰</span>
						<div>
							<strong>Belum ada catatan absen untuk hari ini ({formatIndoDate(data.todayStr)})</strong>
							<p>Silakan lakukan presensi masuk Anda sekarang.</p>
						</div>
						<a href="/absen" class="btn btn-primary btn-sm ml-auto">✍️ Absen Hari Ini</a>
					</div>
				{/if}

				<!-- Worker Stats Grid -->
				<div class="stats-grid">
					<div class="card stat-card stat-accent">
						<div class="stat-top">
							<span class="stat-title">Hari Kerja ({data.workerStats?.monthName})</span>
							<span class="stat-icon">📅</span>
						</div>
						<div class="stat-number">{data.workerStats?.totalHadir || 0} <small>Hari</small></div>
						<div class="stat-desc">Total kehadiran bulan berjalan</div>
					</div>

					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Total Jam Lembur</span>
							<span class="stat-icon">⏱️</span>
						</div>
						<div class="stat-number">{data.workerStats?.totalLemburJam || 0} <small>Jam</small></div>
						<div class="stat-desc">Lembur hari: {data.workerStats?.totalLemburHari || 0} hari</div>
					</div>

					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Estimasi Upah Bulan Ini</span>
							<span class="stat-icon">💰</span>
						</div>
						<div class="stat-number price-highlight">{formatRupiah(data.workerStats?.totalUpahEstimasi || 0)}</div>
						<div class="stat-desc">Total upah pokok & lembur terhitung</div>
					</div>

					<div class="card stat-card">
						<div class="stat-top">
							<span class="stat-title">Tarif Harian Normal</span>
							<span class="stat-icon">🏷️</span>
						</div>
						<div class="stat-number">{formatRupiah(data.userProfile.rate_harian || 0)}</div>
						<div class="stat-desc">Lembur/jam: {formatRupiah(data.userProfile.rate_lembur_jam || 0)}</div>
					</div>
				</div>

				<!-- Quick Worker Links -->
				<div class="card quick-actions-card">
					<h3>⚡ Pintasan Cepat Pekerja</h3>
					<div class="quick-btn-grid-2">
						<a href="/absen" class="quick-link">
							<span class="quick-icon">✍️</span>
							<div>
								<strong>Input Absensi Hari Ini</strong>
								<p>Laporkan kehadiran dan lembur harian</p>
							</div>
						</a>

						<a href="/absen/riwayat" class="quick-link">
							<span class="quick-icon">📅</span>
							<div>
								<strong>Riwayat Absen & Slip Gaji</strong>
								<p>Pantau rincian kehadiran dan total upah</p>
							</div>
						</a>
					</div>
				</div>

				<!-- Worker Recent Attendance History -->
				<div class="card table-card">
					<div class="card-header-flex">
						<div>
							<h3>Riwayat Absensi Terakhir Anda</h3>
							<p class="card-subtitle">8 catatan kehadiran terbaru yang telah tersimpan</p>
						</div>
						<a href="/absen/riwayat" class="btn btn-secondary btn-sm">Buka Semua Riwayat ➔</a>
					</div>

					{#if data.recentActivities.length === 0}
						<div class="empty-state">
							<p>Belum ada catatan riwayat absensi bulan ini.</p>
						</div>
					{:else}
						<div class="table-responsive">
							<table class="data-table">
								<thead>
									<tr>
										<th>Tanggal</th>
										<th>Lokasi Proyek</th>
										<th>Kehadiran</th>
										<th>Lembur Jam</th>
										<th>Lembur Hari</th>
									</tr>
								</thead>
								<tbody>
									{#each data.recentActivities as a}
										<tr>
											<td><strong>{formatIndoDate(a.tanggal)}</strong></td>
											<td>{a.nama_projek}</td>
											<td>
												{#if Number(a.hadir_harian) === 1}
													<span class="badge badge-success">1 Hari Penuh</span>
												{:else if Number(a.hadir_harian) === 0.5}
													<span class="badge badge-warning">1/2 Hari</span>
												{:else}
													<span class="badge badge-danger">Libur / 0</span>
												{/if}
											</td>
											<td>{Number(a.lembur_jam) > 0 ? `${a.lembur_jam} Jam` : '-'}</td>
											<td>{Number(a.lembur_hari) > 0 ? 'Ya' : '-'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB 2: UBAH DATA DIRI -->
	{#if activeTab === 'edit'}
		<div class="tab-panel">
			<div class="card form-card">
				<div class="form-card-header">
					<h3>✍️ Perbarui Data Profil</h3>
					<p>Pastikan nama dan nomor WhatsApp Anda valid agar pengawas proyek dapat menghubungi Anda.</p>
				</div>

				<form 
					method="POST" 
					action="?/updateProfile"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
						};
					}}
				>
					<div class="form-grid-2">
						<div class="form-group">
							<label for="input_nama" class="form-label">Nama Lengkap Pekerja / Admin</label>
							<input 
								id="input_nama" 
								name="nama" 
								type="text" 
								class="input" 
								bind:value={inputNama} 
								required 
								placeholder="Masukkan nama lengkap..."
							/>
							<span class="field-hint">Nama ini akan tercantum pada lembar rekapitulasi dan slip absensi.</span>
						</div>

						<div class="form-group">
							<label for="input_username" class="form-label">Username Login</label>
							<input 
								id="input_username" 
								name="username" 
								type="text" 
								class="input font-mono" 
								bind:value={inputUsername} 
								required 
								placeholder="nama_pengguna"
							/>
							<span class="field-hint">Digunakan untuk masuk ke aplikasi. Minimal 3 karakter.</span>
						</div>
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="input_nohp" class="form-label">Nomor WhatsApp / HP</label>
							<input 
								id="input_nohp" 
								name="no_hp" 
								type="tel" 
								class="input" 
								bind:value={inputNoHp} 
								placeholder="0812xxxxxxxx"
							/>
							<span class="field-hint">Nomor telepon aktif untuk komunikasi tim lapangan.</span>
						</div>

						<div class="form-group">
							<label for="info_role" class="form-label">Peran & Hak Akses</label>
							<input 
								id="info_role" 
								type="text" 
								class="input bg-readonly" 
								value={data.userProfile.role === 'ADMIN' ? 'Administrator Proyek (Full Control)' : 'Pekerja / Tukang (Absensi Mandiri)'} 
								disabled 
							/>
							<span class="field-hint">Hak akses akun diatur oleh administrator pusat.</span>
						</div>
					</div>

					{#if data.userProfile.role !== 'ADMIN'}
						<div class="form-grid-2">
							<div class="form-group">
								<label for="info_jabatan" class="form-label">Jabatan Pekerja</label>
								<input 
									id="info_jabatan" 
									type="text" 
									class="input bg-readonly" 
									value={data.userProfile.nama_jabatan || 'Belum diatur'} 
									disabled 
								/>
							</div>

							<div class="form-group">
								<label for="info_projek" class="form-label">Proyek Penugasan</label>
								<input 
									id="info_projek" 
									type="text" 
									class="input bg-readonly" 
									value={data.userProfile.nama_projek ? `${data.userProfile.nama_projek} (${data.userProfile.lokasi_projek || 'Aktif'})` : 'Umum / Semua Proyek'} 
									disabled 
								/>
							</div>
						</div>
					{/if}

					<div class="form-actions">
						<button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
							{#if isSubmitting}
								<span>⏳ Menyimpan Perubahan...</span>
							{:else}
								<span>💾 Simpan Perubahan Profil</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- TAB 3: KEAMANAN & SANDI -->
	{#if activeTab === 'security'}
		<div class="tab-panel">
			<div class="card form-card">
				<div class="form-card-header">
					<h3>🔒 Ubah Kata Sandi Akun</h3>
					<p>Gunakan kombinasi kata sandi yang aman dan mudah Anda ingat untuk login ke aplikasi AbsenPak.</p>
				</div>

				<form 
					method="POST" 
					action="?/updatePassword"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
							currentPassword = '';
							newPassword = '';
							confirmPassword = '';
						};
					}}
				>
					<div class="form-group">
						<label for="current_password" class="form-label">Kata Sandi Saat Ini</label>
						<input 
							id="current_password" 
							name="current_password" 
							type={showPassword ? 'text' : 'password'} 
							class="input" 
							bind:value={currentPassword} 
							required 
							placeholder="Masukkan kata sandi lama Anda..."
						/>
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="new_password" class="form-label">Kata Sandi Baru</label>
							<input 
								id="new_password" 
								name="new_password" 
								type={showPassword ? 'text' : 'password'} 
								class="input" 
								bind:value={newPassword} 
								required 
								minlength="6"
								placeholder="Minimal 6 karakter..."
							/>
							<span class="field-hint">Minimal 6 karakter kombinasi huruf dan angka.</span>
						</div>

						<div class="form-group">
							<label for="confirm_password" class="form-label">Konfirmasi Kata Sandi Baru</label>
							<input 
								id="confirm_password" 
								name="confirm_password" 
								type={showPassword ? 'text' : 'password'} 
								class="input" 
								bind:value={confirmPassword} 
								required 
								minlength="6"
								placeholder="Ulangi kata sandi baru..."
							/>
						</div>
					</div>

					<div class="password-toggle-box">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={showPassword} />
							<span>Tampilkan teks kata sandi</span>
						</label>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
							{#if isSubmitting}
								<span>⏳ Mengubah Sandi...</span>
							{:else}
								<span>🔐 Perbarui Kata Sandi</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	.profile-page {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-top {
		margin-bottom: 0.25rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--primary);
		font-weight: 600;
		margin-bottom: 0.5rem;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	.page-top h1 {
		font-size: 1.75rem;
		margin-bottom: 0.25rem;
	}

	.page-top p {
		color: var(--text-muted);
		font-size: 0.925rem;
	}

	/* Alerts */
	.alert-success,
	.alert-error,
	.alert-info {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		box-shadow: var(--shadow-sm);
	}

	.alert-success {
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #065f46;
	}

	.alert-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.alert-info {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		color: #1e40af;
	}

	.alert-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	/* Profile Hero Card */
	.profile-hero-card {
		padding: 1.5rem 1.75rem 0;
		border-radius: var(--radius-lg);
		background: linear-gradient(to bottom, #ffffff, #fafafa);
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.profile-hero-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.hero-avatar {
		width: 80px;
		height: 80px;
		min-width: 80px;
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 800;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
		border: 3px solid #ffffff;
	}

	.hero-details {
		flex: 1;
		min-width: 0;
	}

	.hero-name-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.65rem;
	}

	.hero-name-row h2 {
		font-size: 1.5rem;
		margin: 0;
		color: var(--text-main);
	}

	.role-pill {
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.role-admin {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}

	.role-worker {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.status-pill {
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.status-active {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}

	.hero-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem 1.25rem;
		font-size: 0.85rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.meta-label {
		color: var(--text-muted);
		font-weight: 500;
	}

	.meta-val {
		color: var(--text-main);
		font-weight: 600;
	}

	/* Tabs */
	.profile-tabs {
		display: flex;
		gap: 0.5rem;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.25rem;
		overflow-x: auto;
	}

	.tab-btn {
		background: none;
		border: none;
		padding: 0.85rem 1.15rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-muted);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.15s ease;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.tab-btn:hover {
		color: var(--primary);
	}

	.tab-btn.active {
		color: var(--primary);
		border-bottom-color: var(--primary);
		font-weight: 700;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		padding: 1.25rem;
		border-radius: var(--radius-md);
		background: white;
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.stat-accent {
		border-color: #bfdbfe;
		background: linear-gradient(to bottom, #ffffff, #f0f7ff);
	}

	.stat-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stat-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-icon {
		font-size: 1.25rem;
	}

	.stat-number {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.1;
	}

	.stat-number small {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.price-highlight {
		color: #1e40af;
		font-size: 1.45rem;
	}

	.stat-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Quick Actions */
	.quick-actions-card {
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.5rem;
	}

	.quick-actions-card h3 {
		font-size: 1.05rem;
		margin-bottom: 1rem;
	}

	.quick-btn-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.quick-btn-grid-2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 1rem;
		background: #f8fafc;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.quick-link:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.quick-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}

	.quick-link strong {
		display: block;
		font-size: 0.9rem;
		color: var(--text-main);
		margin-bottom: 0.15rem;
	}

	.quick-link p {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* Table Card */
	.card-header-flex {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.card-header-flex h3 {
		font-size: 1.1rem;
		margin: 0 0 0.2rem 0;
	}

	.card-subtitle {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* Form Card */
	.form-card {
		padding: 1.75rem;
		background: white;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.form-card-header {
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: 1rem;
	}

	.form-card-header h3 {
		font-size: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.form-card-header p {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin: 0;
	}

	.form-grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.field-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.bg-readonly {
		background: #f1f5f9;
		cursor: not-allowed;
		color: var(--text-muted);
	}

	.password-toggle-box {
		margin-bottom: 1.25rem;
	}

	.checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-main);
		cursor: pointer;
		user-select: none;
	}

	.form-actions {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border-subtle);
		display: flex;
		justify-content: flex-start;
	}

	.badge-light {
		background: #f1f5f9;
		color: #475569;
	}

	.font-mono {
		font-family: var(--font-mono);
	}

	.mb-4 {
		margin-bottom: 1rem;
	}

	.ml-auto {
		margin-left: auto;
	}

	/* Responsive */
	@media (max-width: 960px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.quick-btn-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.profile-hero-content {
			flex-direction: column;
			text-align: center;
		}

		.hero-name-row {
			justify-content: center;
		}

		.hero-meta-grid {
			grid-template-columns: 1fr;
			text-align: left;
		}

		.form-grid-2 {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.quick-btn-grid,
		.quick-btn-grid-2 {
			grid-template-columns: 1fr;
		}

		.alert-info {
			flex-direction: column;
		}

		.ml-auto {
			margin-left: 0;
			margin-top: 0.5rem;
		}
	}
</style>

