<script lang="ts">
	import type { PageProps } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let isSubmitting = $state(false);

	let selectedProjekId = $state(data.karyawan.projek_id ? String(data.karyawan.projek_id) : '');
	let selectedTanggal = $state(data.selectedDate || new Date().toISOString().split('T')[0]);

	// State of existing attendance
	let existingHarian = $derived(Number(data.existingAttendance?.hadir_harian || 0));
	let existingLemburHari = $derived(Number(data.existingAttendance?.lembur_hari || 0));
	let existingLemburJam = $derived(Number(data.existingAttendance?.lembur_jam || 0));

	let isSudahSetengahHari = $derived(existingHarian === 0.5);
	let isSudahHarianPenuh = $derived(existingHarian >= 1);
	let isSudahHarian = $derived(existingHarian > 0);
	let isSudahLemburHari = $derived(existingLemburHari >= 1);
	let isSudahPenuh = $derived(isSudahHarianPenuh && isSudahLemburHari);

	// Apakah sudah pernah ada catatan presensi hari ini?
	let sudahPernahAbsenHariIni = $derived(
		Boolean(
			data.existingAttendance &&
			(existingHarian > 0 || existingLemburHari > 0 || existingLemburJam > 0)
		)
	);

	// Tipe Presensi (HARIAN, SETENGAH_HARI, LEMBUR_JAM, LEMBUR_HARI)
	let tipePresensi = $state('HARIAN');
	let lemburJam = $state('1');
	let tambahLemburLangsung = $state(false);
	let keterangan = $state('');
	let showProjectDateSettings = $state(false);
	let showRiwayatMobile = $state(false);

	const quickHoursAlreadyClocked = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	const quickHoursInitial = [1, 2, 3, 4, 5, 6, 7, 8];

	$effect(() => {
		if (sudahPernahAbsenHariIni) {
			if (tipePresensi !== 'LEMBUR_HARI' && tipePresensi !== 'LEMBUR_JAM') {
				tipePresensi = 'LEMBUR_JAM';
			}
		}
		if (data.existingAttendance && Number(data.existingAttendance.lembur_jam) > 0) {
			lemburJam = String(Math.floor(Number(data.existingAttendance.lembur_jam)));
		} else {
			lemburJam = sudahPernahAbsenHariIni ? '1' : '2';
		}
		keterangan = data.existingAttendance?.keterangan || '';
	});

	// Active project name locked to master data assignment
	let activeProjectObj = $derived(
		data.activeProjects[0] || {
			id: data.karyawan.projek_id,
			nama_projek: data.karyawan.nama_projek || 'Belum Diatur',
			lokasi: data.karyawan.lokasi_projek || ''
		}
	);

	function formatDateIndo(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function onFilterChange() {
		window.location.href = `/absen?tanggal=${selectedTanggal}`;
	}
</script>

<div class="container worker-container">
	<!-- Top Compact Worker Profile Header (Tanpa Info Rate) -->
	<div class="profile-card">
		<div class="profile-left">
			<div class="avatar-circle">
				{data.karyawan.nama.slice(0, 2).toUpperCase()}
			</div>
			<div class="profile-meta">
				<div class="name-badge-row">
					<h1 class="worker-name">{data.karyawan.nama}</h1>
					<span class="status-chip">Aktif</span>
				</div>
				<p class="worker-role">
					{data.karyawan.nama_jabatan || 'Pekerja'} • 
					<span class="project-tag">🏗️ {activeProjectObj?.nama_projek || 'Belum Diatur'}</span>
				</p>
			</div>
		</div>
	</div>

	<!-- Alerts -->
	{#if !data.karyawan.projek_id}
		<div class="alert-error">
			<span class="alert-icon">⚠️</span>
			<div>
				<strong>Lokasi Proyek Belum Diatur di Data Master</strong>
				<p>Akun Anda belum memiliki penugasan proyek. Hubungi admin untuk mengatur lokasi proyek di data master karyawan sebelum dapat melakukan absensi.</p>
			</div>
		</div>
	{/if}

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
				<strong>Perhatian:</strong>
				<p>{form.error}</p>
			</div>
		</div>
	{/if}

	<div class="worker-grid">
		<!-- Main Attendance Action Card -->
		<div class="card action-card">
			<!-- Date & Location Bar -->
			<div class="date-location-bar">
				<div class="dl-left">
					<span class="dl-icon">📍</span>
					<div>
						<div class="dl-date">{formatDateIndo(selectedTanggal)}</div>
						<div class="dl-sub">
							Lokasi: <strong>{activeProjectObj?.nama_projek}</strong> {activeProjectObj?.lokasi ? `(${activeProjectObj.lokasi})` : ''}
							<span class="badge-master-lock">🔒 Sesuai Master Data</span>
						</div>
					</div>
				</div>
				<button 
					type="button" 
					class="btn-text-edit" 
					onclick={() => showProjectDateSettings = !showProjectDateSettings}
				>
					{showProjectDateSettings ? '✕ Tutup' : '📅 Ganti Tanggal'}
				</button>
			</div>

			<!-- Collapsible Date Pickers -->
			{#if showProjectDateSettings}
				<div class="date-project-picker-box">
					<div class="form-row">
						<div class="form-group flex-1">
							<label class="form-label">Lokasi Proyek (Data Master)</label>
							<div class="locked-project-box">
								<span class="locked-icon">🏗️</span>
								<div class="locked-text">
									<strong>{activeProjectObj?.nama_projek || 'Belum Diatur'}</strong>
									<span class="locked-desc">Terkunci otomatis sesuai lokasi penugasan master</span>
								</div>
							</div>
						</div>
						<div class="form-group flex-1">
							<label for="tanggal" class="form-label">Tanggal Presensi</label>
							<input 
								id="tanggal" 
								name="tanggal" 
								type="date" 
								class="input" 
								bind:value={selectedTanggal} 
								onchange={onFilterChange} 
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- ATTENDANCE FORM -->
			<form 
				method="POST" 
				action="?/simpan" 
				class="mobile-absen-form"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
			>
				<!-- Hidden Project and Date for submission -->
				<input type="hidden" name="projek_id" value={selectedProjekId} />
				<input type="hidden" name="tanggal" value={selectedTanggal} />

				<!-- SCENARIO 1: SUDAH PENUH (Harian >= 1 && Lembur Hari >= 1) -->
				{#if isSudahPenuh}
					<div class="full-card">
						<div class="full-badge">🔒 ABSENSI LENGKAP & TERKUNCI</div>
						<h3>Kebutuhan Hari Ini Sudah Terisi Penuh</h3>
						<p class="full-desc">
							Anda telah mengisi kuota hadir normal 1 hari dan lembur 1 hari penuh untuk tanggal ini.
						</p>

						<div class="full-breakdown">
							<div class="fb-row">
								<span>☀️ Hadir Normal:</span>
								<strong>1 Hari Penuh</strong>
							</div>
							<div class="fb-row">
								<span>🌟 Lembur Hari Penuh:</span>
								<strong>1 Hari Penuh</strong>
							</div>
							<div class="fb-divider"></div>
							<div class="fb-row fb-total">
								<span>Status Absensi:</span>
								<strong class="total-text">Lengkap (2 Shift)</strong>
							</div>
						</div>
					</div>
					<!-- Submit button is completely hidden as requested -->

				<!-- SCENARIO 2: SUDAH PERNAH ABSEN HARI INI -> BISA TAMBAH LEMBUR JAM ATAU LEMBUR HARI -->
				{:else if sudahPernahAbsenHariIni}
					<input type="hidden" name="tipe_presensi" value={tipePresensi} />

					<!-- Status Tercatat -->
					<div class="notice-clocked-in">
						<div class="nci-header">
							<span class="nci-icon">✅</span>
							<div>
								<strong>Presensi Hari Ini Telah Tercatat:</strong>
								<p>
									{#if isSudahSetengahHari}
										Tercatat: <strong>🌤️ Hadir Setengah Hari (1/2 Hari)</strong>
									{:else if isSudahHarianPenuh}
										Tercatat: <strong>☀️ Hadir Normal 1 Hari</strong>
									{/if}
									{#if isSudahLemburHari}
										• <strong>🌟 Lembur Hari Penuh (1 Hari)</strong>
									{/if}
									{#if existingLemburJam > 0}
										• Lembur Jam: <strong>{existingLemburJam} Jam</strong>
									{/if}
								</p>
							</div>
						</div>
						<div class="nci-rule">
							⚡ <em>Anda dapat menambah <strong>Lembur Jam</strong> atau <strong>Lembur 1 Hari Penuh</strong> untuk hari ini.</em>
						</div>
					</div>

					<!-- Touch Cards Pilihan Tambahan Lembur -->
					<div class="section-title">
						<span>📋</span> Pilih Tambahan Lembur Hari Ini:
					</div>

					<div class="type-cards-list">
						<!-- Pilihan 1: Lembur Jam -->
						<button
							type="button"
							class="type-touch-card {tipePresensi === 'LEMBUR_JAM' ? 'active' : ''}"
							onclick={() => tipePresensi = 'LEMBUR_JAM'}
						>
							<div class="ttc-radio">
								{#if tipePresensi === 'LEMBUR_JAM'}
									<div class="ttc-radio-inner"></div>
								{/if}
							</div>
							<div class="ttc-icon">⏱️</div>
							<div class="ttc-body">
								<div class="ttc-name">Lembur Jam</div>
								<div class="ttc-desc">Dihitung per jam kerja tambahan</div>
							</div>
							<div class="ttc-badge">Per Jam</div>
						</button>

						<!-- Pilihan 2: Lembur 1 Hari Penuh (jika belum lembur hari) -->
						{#if !isSudahLemburHari}
							<button
								type="button"
								class="type-touch-card {tipePresensi === 'LEMBUR_HARI' ? 'active' : ''}"
								onclick={() => tipePresensi = 'LEMBUR_HARI'}
							>
								<div class="ttc-radio">
									{#if tipePresensi === 'LEMBUR_HARI'}
										<div class="ttc-radio-inner"></div>
									{/if}
								</div>
								<div class="ttc-icon">🌟</div>
								<div class="ttc-body">
									<div class="ttc-name">Lembur 1 Hari Penuh</div>
									<div class="ttc-desc">Shift lembur 1 hari penuh tambahan</div>
								</div>
								<div class="ttc-badge">1 Hari Penuh</div>
							</button>
						{/if}
					</div>

					{#if tipePresensi === 'LEMBUR_JAM'}
						<!-- Quick Tap Overtime Hour Chips -->
						<div class="section-title mt-3">
							<span>⏱️</span> Pilih Berapa Jam Lembur:
						</div>

						<div class="chips-grid">
							{#each quickHoursAlreadyClocked as h}
								<button
									type="button"
									class="chip-card {lemburJam === String(h) ? 'active' : ''}"
									onclick={() => lemburJam = String(h)}
								>
									{#if lemburJam === String(h)}
										<span class="chip-check">✓</span>
									{/if}
									<span class="chip-hours">{h} Jam</span>
									<span class="chip-sub">
										{h === 0 ? 'Tanpa Lembur' : 'Lembur'}
									</span>
								</button>
							{/each}
						</div>
						<input type="hidden" name="lembur_jam" value={lemburJam} />
					{:else if tipePresensi === 'LEMBUR_HARI'}
						<div class="full-notice-box">
							🌟 <strong>Lembur 1 Hari Penuh</strong> akan disimpan bersamaan dengan kehadiran normal Anda untuk tanggal ini.
						</div>
					{/if}

					<!-- Catatan Lembur -->
					<div class="form-group mt-3">
						<label for="keterangan" class="form-label-compact">Catatan Lembur (Opsional)</label>
						<input
							id="keterangan"
							name="keterangan"
							type="text"
							class="input input-touch"
							placeholder="Misal: Lembur cor tiang atau pasang bata"
							bind:value={keterangan}
						/>
					</div>

					<!-- Ringkasan Pilihan Presensi -->
					<div class="summary-choice-card">
						<div class="sc-row">
							<span>Presensi Tercatat:</span>
							<strong>{isSudahSetengahHari ? 'Hadir Setengah Hari (1/2)' : (isSudahHarianPenuh ? 'Hadir Normal 1 Hari' : (isSudahLemburHari ? 'Lembur Hari Penuh 1 Hari' : '-'))}</strong>
						</div>
						<div class="sc-row">
							<span>Tambahan Lembur:</span>
							<strong>
								{#if tipePresensi === 'LEMBUR_HARI'}
									🌟 Lembur 1 Hari Penuh
								{:else}
									⏱️ Lembur {lemburJam} Jam
								{/if}
							</strong>
						</div>
					</div>

					<button type="submit" class="btn btn-primary btn-touch-lg btn-full" disabled={isSubmitting || !data.karyawan.projek_id}>
						{#if isSubmitting}
							⏳ Menyimpan...
						{:else if tipePresensi === 'LEMBUR_HARI'}
							💾 Simpan Lembur 1 Hari Penuh
						{:else}
							💾 Simpan Lembur Jam ({lemburJam} Jam)
						{/if}
					</button>

				<!-- SCENARIO 3: BELUM PERNAH ABSEN HARI INI -> 4 Kartu Pilihan Sentuh (Tanpa Rate) -->
				{:else}
					<div class="section-title">
						<span>📋</span> Pilih Tipe Kehadiran Hari Ini:
					</div>

					<!-- 4 Big Touch Cards for Mobile Usability -->
					<div class="type-cards-list">
						<!-- Card 1: Hadir Normal Penuh -->
						<button
							type="button"
							class="type-touch-card {tipePresensi === 'HARIAN' ? 'active' : ''}"
							onclick={() => tipePresensi = 'HARIAN'}
						>
							<div class="ttc-radio">
								{#if tipePresensi === 'HARIAN'}
									<div class="ttc-radio-inner"></div>
								{/if}
							</div>
							<div class="ttc-icon">☀️</div>
							<div class="ttc-body">
								<div class="ttc-name">Hadir Penuh</div>
								<div class="ttc-desc">1 Hari Kerja Penuh</div>
							</div>
							<div class="ttc-badge">1 Hari</div>
						</button>

						<!-- Card 2: Hadir Setengah Hari -->
						<button
							type="button"
							class="type-touch-card {tipePresensi === 'SETENGAH_HARI' ? 'active' : ''}"
							onclick={() => tipePresensi = 'SETENGAH_HARI'}
						>
							<div class="ttc-radio">
								{#if tipePresensi === 'SETENGAH_HARI'}
									<div class="ttc-radio-inner"></div>
								{/if}
							</div>
							<div class="ttc-icon">🌤️</div>
							<div class="ttc-body">
								<div class="ttc-name">Setengah Hari</div>
								<div class="ttc-desc">Upah 50% dari harian penuh</div>
							</div>
							<div class="ttc-badge badge-info">1/2 Hari</div>
						</button>

						<!-- Card 3: Lembur Jam -->
						<button
							type="button"
							class="type-touch-card {tipePresensi === 'LEMBUR_JAM' ? 'active' : ''}"
							onclick={() => tipePresensi = 'LEMBUR_JAM'}
						>
							<div class="ttc-radio">
								{#if tipePresensi === 'LEMBUR_JAM'}
									<div class="ttc-radio-inner"></div>
								{/if}
							</div>
							<div class="ttc-icon">⏱️</div>
							<div class="ttc-body">
								<div class="ttc-name">Hanya Lembur Jam</div>
								<div class="ttc-desc">Dihitung per jam kerja</div>
							</div>
							<div class="ttc-badge">Per Jam</div>
						</button>

						<!-- Card 4: Lembur 1 Hari Penuh -->
						<button
							type="button"
							class="type-touch-card {tipePresensi === 'LEMBUR_HARI' ? 'active' : ''}"
							onclick={() => tipePresensi = 'LEMBUR_HARI'}
						>
							<div class="ttc-radio">
								{#if tipePresensi === 'LEMBUR_HARI'}
									<div class="ttc-radio-inner"></div>
								{/if}
							</div>
							<div class="ttc-icon">🌟</div>
							<div class="ttc-body">
								<div class="ttc-name">Lembur 1 Hari Penuh</div>
								<div class="ttc-desc">Shift lembur 1 hari penuh</div>
							</div>
							<div class="ttc-badge">1 Hari Penuh</div>
						</button>
					</div>

					<input type="hidden" name="tipe_presensi" value={tipePresensi} />

					<!-- Direct Overtime Option for HARIAN or SETENGAH_HARI -->
					{#if tipePresensi === 'HARIAN' || tipePresensi === 'SETENGAH_HARI'}
						<div class="combo-overtime-box">
							<label class="combo-overtime-label">
								<input type="checkbox" bind:checked={tambahLemburLangsung} />
								<span>⚡ Tambahkan Lembur Jam Sekaligus (Opsional)</span>
							</label>

							{#if tambahLemburLangsung}
								<div class="chips-title mt-2">⏱️ Pilih Jumlah Jam Lembur:</div>
								<div class="chips-grid">
									{#each quickHoursInitial as h}
										<button
											type="button"
											class="chip-card {lemburJam === String(h) ? 'active' : ''}"
											onclick={() => lemburJam = String(h)}
										>
											{#if lemburJam === String(h)}
												<span class="chip-check">✓</span>
											{/if}
											<span class="chip-hours">{h} Jam</span>
											<span class="chip-sub">Lembur</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<input type="hidden" name="lembur_jam" value={tambahLemburLangsung ? lemburJam : '0'} />
					{/if}

					<!-- If LEMBUR_JAM is chosen: Display Touch Hour Chips -->
					{#if tipePresensi === 'LEMBUR_JAM'}
						<div class="overtime-selection-box">
							<div class="chips-title">⏱️ Pilih Jumlah Jam Lembur:</div>
							<div class="chips-grid">
								{#each quickHoursInitial as h}
									<button
										type="button"
										class="chip-card {lemburJam === String(h) ? 'active' : ''}"
										onclick={() => lemburJam = String(h)}
									>
										{#if lemburJam === String(h)}
											<span class="chip-check">✓</span>
										{/if}
										<span class="chip-hours">{h} Jam</span>
										<span class="chip-sub">Jam Kerja</span>
									</button>
								{/each}
							</div>
							<input type="hidden" name="lembur_jam" value={lemburJam} />
						</div>
					{/if}

					<!-- Catatan -->
					<div class="form-group mt-3">
						<label for="keterangan" class="form-label-compact">Catatan Pekerjaan (Opsional)</label>
						<input
							id="keterangan"
							name="keterangan"
							type="text"
							class="input input-touch"
							placeholder="Misal: Pasang hebel lantai 2"
							bind:value={keterangan}
						/>
					</div>

					<!-- Ringkasan Pilihan Presensi -->
					<div class="summary-choice-card">
						<div class="sc-row">
							<span>Pilihan Presensi:</span>
							<strong>
								{#if tipePresensi === 'HARIAN'}
									Hadir Penuh (1 Hari)
								{:else if tipePresensi === 'SETENGAH_HARI'}
									Hadir Setengah Hari (1/2 Hari)
								{:else if tipePresensi === 'LEMBUR_JAM'}
									Lembur {lemburJam} Jam
								{:else}
									Lembur 1 Hari Penuh
								{/if}
							</strong>
						</div>
						{#if (tipePresensi === 'HARIAN' || tipePresensi === 'SETENGAH_HARI') && tambahLemburLangsung}
							<div class="sc-row">
								<span>Tambahan Lembur:</span>
								<strong>⏱️ Lembur {lemburJam} Jam</strong>
							</div>
						{/if}
					</div>

					<!-- Primary Submit Button -->
					<button type="submit" class="btn btn-primary btn-touch-lg btn-full" disabled={isSubmitting || !data.karyawan.projek_id}>
						{#if isSubmitting}
							⏳ Menyimpan...
						{:else if tipePresensi === 'SETENGAH_HARI'}
							💾 Simpan Absen Setengah Hari
						{:else if tipePresensi === 'HARIAN'}
							💾 Simpan Hadir Normal 1 Hari
						{:else if tipePresensi === 'LEMBUR_HARI'}
							💾 Simpan Lembur 1 Hari Penuh
						{:else}
							💾 Simpan Lembur Jam ({lemburJam} Jam)
						{/if}
					</button>
				{/if}
			</form>
		</div>

		<!-- Right Side (Desktop) / Collapsible Accordion (Mobile): 7 Days History -->
		<div class="card history-panel">
			<div class="history-header">
				<div class="hh-title">
					<h2>Riwayat 7 Hari Terakhir</h2>
					<span class="badge badge-neutral">{data.recentAttendances.length} Catatan</span>
				</div>
				<a href="/absen/riwayat" class="btn btn-secondary btn-sm">Semua ➔</a>
			</div>

			<!-- Mobile toggle bar -->
			<button 
				type="button" 
				class="mobile-history-toggle mobile-only-flex" 
				onclick={() => showRiwayatMobile = !showRiwayatMobile}
			>
				<span>📋 Riwayat 7 Hari ({data.recentAttendances.length} Terdata)</span>
				<span class="m-toggle-arrow">{showRiwayatMobile ? '▲ Tutup' : '▼ Lihat Riwayat'}</span>
			</button>

			<div class="history-content {showRiwayatMobile ? 'show-mobile' : ''}">
				{#if data.recentAttendances.length === 0}
					<div class="empty-state">
						<div class="empty-icon">📝</div>
						<p>Belum ada catatan absensi dalam 7 hari terakhir.</p>
					</div>
				{:else}
					<div class="history-list">
						{#each data.recentAttendances as r}
							<div class="history-row">
								<div class="hr-date-col">
									<div class="hr-date">
										{new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
									</div>
									<div class="hr-proj">{r.nama_projek}</div>
								</div>

								<div class="hr-badges-col">
									{#if Number(r.hadir_harian) === 0.5}
										<span class="badge badge-info">1/2 Hari</span>
									{:else if Number(r.hadir_harian) > 0}
										<span class="badge badge-success">Hadir 1 Hari</span>
									{/if}
									{#if Number(r.lembur_jam) > 0}
										<span class="badge badge-warning">{r.lembur_jam} Jam Lembur</span>
									{/if}
									{#if Number(r.lembur_hari) > 0}
										<span class="badge badge-purple">Lembur 1 Hari</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.worker-container {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	/* Top Profile Card */
	.profile-card {
		background: linear-gradient(135deg, #0f172a, #1e293b);
		color: white;
		border-radius: var(--radius-xl);
		padding: 1.25rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
		flex-wrap: wrap;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
	}

	.profile-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar-circle {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.15rem;
		font-weight: 800;
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
		flex-shrink: 0;
	}

	.profile-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.name-badge-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.worker-name {
		color: white;
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0;
	}

	.status-chip {
		background: #10b981;
		color: white;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		letter-spacing: 0.04em;
	}

	.worker-role {
		color: #94a3b8;
		font-size: 0.85rem;
		margin: 0;
	}

	.project-tag {
		color: #38bdf8;
		font-weight: 600;
	}

	/* Main Grid */
	.worker-grid {
		display: grid;
		grid-template-columns: 1.35fr 1fr;
		gap: 1.25rem;
		align-items: start;
	}

	.action-card {
		padding: 1.5rem;
	}

	/* Date & Location Bar */
	.date-location-bar {
		background: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: 0.85rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.dl-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.dl-icon {
		font-size: 1.5rem;
	}

	.dl-date {
		font-size: 0.95rem;
		font-weight: 700;
		color: #0f172a;
	}

	.dl-sub {
		font-size: 0.78rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.15rem;
	}

	.badge-master-lock {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: #e0f2fe;
		color: #0369a1;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid #bae6fd;
	}

	.locked-project-box {
		background: #ffffff;
		border: 1.5px solid #cbd5e1;
		border-radius: var(--radius-md);
		padding: 0.65rem 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.locked-icon {
		font-size: 1.35rem;
	}

	.locked-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.locked-text strong {
		color: #0f172a;
		font-size: 0.95rem;
	}

	.locked-desc {
		font-size: 0.72rem;
		color: #64748b;
	}

	.btn-text-edit {
		background: white;
		border: 1px solid var(--border-subtle);
		padding: 0.35rem 0.65rem;
		border-radius: var(--radius-md);
		font-size: 0.78rem;
		font-weight: 600;
		color: #475569;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-text-edit:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.date-project-picker-box {
		background: #f1f5f9;
		border-radius: var(--radius-md);
		padding: 1rem;
		margin-bottom: 1.25rem;
	}

	.section-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	/* Touch Cards List */
	.type-cards-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.type-touch-card {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: 0.9rem 1.15rem;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		min-height: 64px;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.type-touch-card:hover {
		border-color: #cbd5e1;
		background: #f8fafc;
	}

	.type-touch-card.active {
		border-color: #2563eb;
		background: #eff6ff;
		box-shadow: 0 0 0 1px #2563eb;
	}

	.ttc-radio {
		width: 20px;
		height: 20px;
		border: 2px solid #94a3b8;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.type-touch-card.active .ttc-radio {
		border-color: #2563eb;
	}

	.ttc-radio-inner {
		width: 10px;
		height: 10px;
		background: #2563eb;
		border-radius: 50%;
	}

	.ttc-icon {
		font-size: 1.6rem;
		flex-shrink: 0;
	}

	.ttc-body {
		flex: 1;
	}

	.ttc-name {
		font-weight: 700;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.ttc-desc {
		font-size: 0.78rem;
		color: #64748b;
	}

	.ttc-badge {
		font-size: 0.85rem;
		font-weight: 700;
		color: #1e40af;
		background: white;
		border: 1px solid #bfdbfe;
		padding: 0.3rem 0.6rem;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.type-touch-card.active .ttc-badge {
		background: #2563eb;
		color: white;
		border-color: #2563eb;
	}

	/* Overtime Quick Hour Chips */
	.overtime-selection-box {
		background: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: 1.15rem;
		margin-bottom: 1.25rem;
	}

	.combo-overtime-box {
		background: #f8fafc;
		border: 1.5px dashed var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 0.9rem 1.15rem;
		margin-bottom: 1.25rem;
	}

	.combo-overtime-label {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-weight: 600;
		font-size: 0.92rem;
		cursor: pointer;
		color: #1e293b;
		user-select: none;
	}

	.combo-overtime-label input[type="checkbox"] {
		width: 1.2rem;
		height: 1.2rem;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.chips-title {
		font-size: 0.88rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.75rem;
	}

	.chips-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.chip-card {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: 0.65rem 0.4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
		transition: all 0.12s ease;
		min-height: 58px;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.chip-card:hover {
		border-color: #cbd5e1;
		background: #f8fafc;
	}

	.chip-card.active {
		border-color: #2563eb;
		background: #eff6ff;
		box-shadow: 0 0 0 1px #2563eb;
	}

	.chip-check {
		position: absolute;
		top: 4px;
		right: 6px;
		font-size: 0.7rem;
		font-weight: 800;
		color: #2563eb;
	}

	.chip-hours {
		font-weight: 800;
		font-size: 1rem;
		color: #0f172a;
	}

	.chip-card.active .chip-hours {
		color: #1d4ed8;
	}

	.chip-sub {
		font-size: 0.68rem;
		color: #64748b;
		font-weight: 600;
		margin-top: 0.15rem;
	}

	.chip-card.active .chip-sub {
		color: #2563eb;
	}

	/* Notice when already clocked in */
	.notice-clocked-in {
		background: #f0fdf4;
		border: 1.5px solid #bbf7d0;
		border-radius: var(--radius-lg);
		padding: 1rem 1.15rem;
		margin-bottom: 1.25rem;
	}

	.nci-header {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.nci-icon {
		font-size: 1.4rem;
		flex-shrink: 0;
	}

	.nci-header strong {
		color: #15803d;
		font-size: 0.95rem;
		display: block;
	}

	.nci-header p {
		color: #166534;
		font-size: 0.825rem;
		margin: 0.2rem 0 0 0;
	}

	.nci-rule {
		margin-top: 0.65rem;
		padding-top: 0.65rem;
		border-top: 1px dashed #bbf7d0;
		font-size: 0.78rem;
		color: #15803d;
	}

	/* Full Attendance Card */
	.full-card {
		background: #f0fdf4;
		border: 2px solid #86efac;
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		text-align: center;
	}

	.full-badge {
		display: inline-block;
		background: #16a34a;
		color: white;
		font-size: 0.75rem;
		font-weight: 800;
		padding: 0.3rem 0.85rem;
		border-radius: 9999px;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.full-card h3 {
		color: #15803d;
		font-size: 1.15rem;
		margin: 0 0 0.4rem 0;
	}

	.full-desc {
		font-size: 0.85rem;
		color: #166534;
		margin-bottom: 1.25rem;
	}

	.full-breakdown {
		background: white;
		border: 1px solid #bbf7d0;
		border-radius: var(--radius-md);
		padding: 1rem;
		text-align: left;
	}

	.fb-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: #334155;
		margin-bottom: 0.4rem;
	}

	.fb-divider {
		border-bottom: 1px dashed #bbf7d0;
		margin: 0.6rem 0;
	}

	.fb-total {
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0;
	}

	.total-text {
		color: #16a34a;
		font-size: 1.1rem;
		font-weight: 800;
	}

	/* Input touch friendly */
	.form-label-compact {
		font-size: 0.825rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 0.35rem;
		display: block;
	}

	.input-touch {
		height: 48px;
		font-size: 0.95rem;
		border-radius: var(--radius-md);
	}

	/* Summary Choice Card (Tanpa Nilai Uang) */
	.summary-choice-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: 0.9rem 1.15rem;
		margin: 1.25rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.sc-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.88rem;
		color: #475569;
	}

	.sc-row strong {
		color: #1e40af;
		font-weight: 700;
	}

	.full-notice-box {
		background: #fdf4ff;
		border: 1px solid #f0abfc;
		color: #86198f;
		padding: 0.85rem 1.15rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		margin-top: 1rem;
		line-height: 1.4;
	}

	.btn-touch-lg {
		height: 54px;
		font-size: 1.05rem;
		font-weight: 700;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
		transition: all 0.15s ease;
	}

	.btn-touch-lg:active {
		transform: scale(0.98);
	}

	/* History Panel */
	.history-panel {
		padding: 1.5rem;
	}

	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.hh-title {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.hh-title h2 {
		font-size: 1.15rem;
		margin: 0;
	}

	.mobile-only-flex {
		display: none;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.history-row {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: 0.75rem 0.9rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.hr-date-col {
		display: flex;
		flex-direction: column;
	}

	.hr-date {
		font-weight: 700;
		font-size: 0.85rem;
		color: #0f172a;
	}

	.hr-proj {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.hr-badges-col {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	/* Responsive Media Queries */
	@media (max-width: 860px) {
		.worker-grid {
			grid-template-columns: 1fr;
		}

		.profile-card {
			padding: 1rem 1.15rem;
			gap: 1rem;
		}

		.worker-name {
			font-size: 1.2rem;
		}

		.action-card {
			padding: 1.15rem;
		}

		/* Mobile Accordion for History */
		.history-panel {
			padding: 1rem 1.15rem;
		}

		.history-header {
			display: none;
		}

		.mobile-only-flex {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: var(--radius-md);
			padding: 0.75rem 1rem;
			font-size: 0.88rem;
			font-weight: 700;
			color: #334155;
			cursor: pointer;
		}

		.m-toggle-arrow {
			font-size: 0.75rem;
			color: #2563eb;
			font-weight: 700;
		}

		.history-content {
			display: none;
			margin-top: 0.85rem;
		}

		.history-content.show-mobile {
			display: block;
		}
	}
</style>
