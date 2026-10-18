<script lang="ts">
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	let filterProjekId = $state(String(data.selectedProjekId));
	let filterMode = $state(data.mode);
	let filterCutoff = $state(data.cutoffDateStr || data.endDateStr);
	let filterBulan = $state(data.currentMonthStr || (data.endDateStr ? data.endDateStr.slice(0, 7) : ''));
	let filterStart = $state(data.startDateStr);
	let filterEnd = $state(data.endDateStr);

	function formatRupiah(num: number) {
		if (!num) return '0';
		return Number(num).toLocaleString('id-ID');
	}

	function formatCurrency(num: number) {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	function applyFilter() {
		const params = new URLSearchParams();
		params.set('projek_id', filterProjekId);
		params.set('mode', filterMode);

		if (filterMode === 'mingguan') {
			params.set('cutoff', filterCutoff);
		} else if (filterMode === 'bulanan') {
			params.set('bulan', filterBulan);
		} else {
			params.set('start_date', filterStart);
			params.set('end_date', filterEnd);
		}

		window.location.href = `/admin/laporan?${params.toString()}`;
	}

	function triggerPrint() {
		window.print();
	}
</script>

<div class="container laporan-container">
	<!-- Control Bar (Hidden on Print) -->
	<div class="card filter-toolbar no-print">
		<div class="toolbar-header">
			<div>
				<a href="/admin" class="back-link">← Kembali ke Dashboard</a>
				<h1>Laporan Penggajian & Rekapitulasi Upah</h1>
				<p>Format matrix mingguan persis sesuai lembar absensi fisik lapangan</p>
			</div>

			<div class="action-buttons">
				<button class="btn btn-secondary btn-print" onclick={triggerPrint}>
					🖨️ Cetak / Download PDF
				</button>
			</div>
		</div>

		<div class="filter-controls-row">
			<div class="f-group">
				<label for="f_projek" class="f-label">Pilih Proyek:</label>
				<select id="f_projek" class="select" bind:value={filterProjekId} onchange={applyFilter}>
					{#each data.projects as p}
						<option value={String(p.id)}>{p.nama_projek} {p.lokasi ? `(${p.lokasi})` : ''}</option>
					{/each}
				</select>
			</div>

			<div class="f-group">
				<label for="f_mode" class="f-label">Periode Waktu:</label>
				<select id="f_mode" class="select" bind:value={filterMode} onchange={applyFilter}>
					<option value="mingguan">Mingguan (Default 7 Hari)</option>
					<option value="bulanan">Bulanan</option>
					<option value="custom">Rentang Tanggal Bebas</option>
				</select>
			</div>

			{#if filterMode === 'mingguan'}
				<div class="f-group">
					<div class="f-label-row">
						<label for="f_cutoff" class="f-label">Tanggal Akhir Periode (Cutoff):</label>
						{#if filterCutoff !== data.runningCutoffStr}
							<button 
								type="button" 
								class="btn-reset-cutoff" 
								onclick={() => { filterCutoff = data.runningCutoffStr; applyFilter(); }}
								title="Kembali ke minggu berjalan"
							>
								⚡ Ke Minggu Ini
							</button>
						{/if}
					</div>
					<input id="f_cutoff" type="date" class="input" bind:value={filterCutoff} onchange={applyFilter} />
				</div>
			{:else if filterMode === 'bulanan'}
				<div class="f-group">
					<label for="f_bulan" class="f-label">Pilih Bulan:</label>
					<input id="f_bulan" type="month" class="input" bind:value={filterBulan} onchange={applyFilter} />
				</div>
			{:else}
				<div class="f-group">
					<label for="f_start" class="f-label">Dari Tanggal:</label>
					<input id="f_start" type="date" class="input" bind:value={filterStart} onchange={applyFilter} />
				</div>
				<div class="f-group">
					<label for="f_end" class="f-label">Sampai Tanggal:</label>
					<input id="f_end" type="date" class="input" bind:value={filterEnd} onchange={applyFilter} />
				</div>
			{/if}

			<button class="btn btn-primary" onclick={applyFilter}>
				Terapkan Filter
			</button>
		</div>
	</div>

	<!-- Authentic Payroll Sheet (Visible on Screen and Pristine on Print) -->
	<div class="payroll-sheet-wrapper print-area">
		<!-- Header Table matching physical sheet exactly -->
		<div class="sheet-top-meta">
			<div class="meta-box-table">
				<div class="meta-row">
					<div class="meta-label">TANGGAL</div>
					<div class="meta-colon">:</div>
					<div class="meta-value">
						<strong>{data.startDateStr}</strong> s/d <strong>{data.endDateStr}</strong> 
						<span class="meta-badge">({data.dayColumns.length} Hari Kerja)</span>
					</div>
				</div>
				<div class="meta-row">
					<div class="meta-label">PROYEK</div>
					<div class="meta-colon">:</div>
					<div class="meta-value uppercase-project">
						<strong>{data.selectedProjek?.nama_projek || 'CON CAT'}</strong>
						{#if data.selectedProjek?.lokasi}
							<span>- {data.selectedProjek.lokasi}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="sheet-title-badge">
				<h2>DAFTAR ABSENSI & UPAH TENAGA KERJA</h2>
			</div>
		</div>

		<!-- The Matrix Table matching the exact physical sheet -->
		<table class="sheet-table">
			<thead>
				<tr>
					<th rowspan="2" class="th-no">NO.</th>
					<th rowspan="2" class="th-jbt">JBT</th>
					<th rowspan="2" class="th-nama">NAMA</th>
					<th rowspan="2" class="th-tipe">TIPE ABSEN</th>
					<th colspan={data.dayColumns.length} class="th-hari-group">HARI / TANGGAL</th>
					<th rowspan="2" class="th-jml">JML</th>
					<th rowspan="2" class="th-gaji">GAJI (RATE)</th>
					<th rowspan="2" class="th-subtotal">SUB TOTAL GAJI</th>
					<th rowspan="2" class="th-total">TOTAL GAJI</th>
				</tr>
				<tr>
					{#each data.dayColumns as col}
						<th class="th-day-col">
							<div class="day-name">{col.dayName}</div>
							<div class="day-date">{col.dateStr.slice(5)}</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if data.reportRows.length === 0}
					<tr>
						<td colspan={8 + data.dayColumns.length} class="empty-cell">
							Tidak ada data absensi untuk proyek dan periode ini.
						</td>
					</tr>
				{:else}
					{#each data.reportRows as row, i}
						<!-- Row 1: HARIAN -->
						<tr class="row-harian">
							<td rowspan="3" class="text-center font-bold">{i + 1}</td>
							<td rowspan="3" class="text-center">{row.worker.nama_jabatan || '-'}</td>
							<td rowspan="3" class="text-left font-bold worker-name-cell">{row.worker.nama}</td>
							
							<td class="text-left font-semibold type-label">HARIAN</td>
							{#each data.dayColumns as col}
								<td class="text-center val-cell">
									{row.harianByDate[col.dateStr] || ''}
								</td>
							{/each}
							<td class="text-center font-bold count-cell">{row.totalHarian || 0}</td>
							<td class="text-right rate-cell">{formatRupiah(row.rateHarian)}</td>
							<td class="text-right font-semibold subtotal-cell">{formatRupiah(row.subtotalHarian)}</td>
							
							<td rowspan="3" class="text-right font-extrabold total-gaji-cell">
								{formatRupiah(row.totalGaji)}
							</td>
						</tr>

						<!-- Row 2: LEMBUR JAM -->
						<tr class="row-lembur-jam">
							<td class="text-left font-semibold type-label">LEMBUR JAM</td>
							{#each data.dayColumns as col}
								<td class="text-center val-cell">
									{row.lemburJamByDate[col.dateStr] || ''}
								</td>
							{/each}
							<td class="text-center font-bold count-cell">{row.totalLemburJam || 0}</td>
							<td class="text-right rate-cell">{formatRupiah(row.rateLemburJam)}</td>
							<td class="text-right font-semibold subtotal-cell">{formatRupiah(row.subtotalLemburJam)}</td>
						</tr>

						<!-- Row 3: LEMBUR HARI -->
						<tr class="row-lembur-hari">
							<td class="text-left font-semibold type-label">LEMBUR HARI</td>
							{#each data.dayColumns as col}
								<td class="text-center val-cell">
									{row.lemburHariByDate[col.dateStr] || ''}
								</td>
							{/each}
							<td class="text-center font-bold count-cell">{row.totalLemburHari || 0}</td>
							<td class="text-right rate-cell">{formatRupiah(row.rateLemburHari)}</td>
							<td class="text-right font-semibold subtotal-cell">{formatRupiah(row.subtotalLemburHari)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			<tfoot>
				<tr class="grand-total-row">
					<td colspan={7 + data.dayColumns.length} class="text-right grand-label-cell">
						<strong>Jumlah =</strong>
					</td>
					<td class="text-right grand-val-cell font-extrabold">
						<strong>{formatCurrency(data.grandTotalGaji)}</strong>
					</td>
				</tr>
			</tfoot>
		</table>

		<!-- Signature & Approvals Footer (Standard for Construction Project Payroll) -->
		<div class="sheet-signatures">
			<div class="sig-box">
				<p>Dibuat Oleh,</p>
				<div class="sig-space"></div>
				<p class="sig-name">( Mandor / Pengawas )</p>
			</div>

			<div class="sig-box">
				<p>Diperiksa Oleh,</p>
				<div class="sig-space"></div>
				<p class="sig-name">( Admin Proyek )</p>
			</div>

			<div class="sig-box">
				<p>Disetujui Oleh,</p>
				<div class="sig-space"></div>
				<p class="sig-name">( Penanggung Jawab Proyek )</p>
			</div>
		</div>
	</div>
</div>

<style>
	.laporan-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filter-toolbar {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.toolbar-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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

	.btn-print {
		background: #0f172a;
		color: white;
		border-color: #0f172a;
		box-shadow: var(--shadow-sm);
	}

	.btn-print:hover {
		background: #1e293b;
		color: white;
	}

	.filter-controls-row {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 1rem;
		border-top: 1px solid var(--border-subtle);
	}

	.f-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.f-label {
		font-size: 0.775rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.f-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-reset-cutoff {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.725rem;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.btn-reset-cutoff:hover {
		color: var(--primary-hover);
	}

	/* Sheet Container matching authentic paper */
	.payroll-sheet-wrapper {
		background: white;
		border: 2px solid #0f172a;
		border-radius: var(--radius-sm);
		padding: 2rem;
		box-shadow: var(--shadow-md);
		overflow-x: auto;
	}

	.sheet-top-meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 2px solid #0f172a;
		padding-bottom: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.meta-box-table {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.meta-row {
		display: flex;
		align-items: center;
		font-size: 0.95rem;
	}

	.meta-label {
		width: 100px;
		font-weight: 800;
		letter-spacing: 0.05em;
	}

	.meta-colon {
		width: 20px;
		font-weight: 800;
	}

	.meta-value {
		color: #0f172a;
	}

	.uppercase-project {
		text-transform: uppercase;
		font-size: 1.05rem;
	}

	.meta-badge {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.sheet-title-badge h2 {
		font-size: 1.2rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		color: #0f172a;
		text-align: right;
	}

	/* Table styling */
	.sheet-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.825rem;
		color: #0f172a;
		background: white;
	}

	.sheet-table th,
	.sheet-table td {
		border: 1px solid #334155;
		padding: 0.45rem 0.5rem;
		vertical-align: middle;
	}

	.sheet-table th {
		background-color: #f1f5f9;
		font-weight: 800;
		text-align: center;
		color: #0f172a;
	}

	.th-no { width: 40px; }
	.th-jbt { width: 75px; }
	.th-nama { width: 140px; }
	.th-tipe { width: 110px; }
	.th-jml { width: 55px; }
	.th-gaji { width: 95px; }
	.th-subtotal { width: 115px; }
	.th-total { width: 130px; background-color: #e2e8f0; }

	.th-day-col {
		min-width: 65px;
		padding: 0.35rem 0.25rem;
	}

	.day-name {
		font-size: 0.75rem;
		font-weight: 800;
	}

	.day-date {
		font-size: 0.65rem;
		color: #475569;
		font-weight: 600;
	}

	.type-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.row-harian td {
		background-color: #ffffff;
	}

	.row-lembur-jam td {
		background-color: #fafafa;
	}

	.row-lembur-hari td {
		background-color: #f4f4f5;
	}

	.val-cell {
		font-size: 0.9rem;
		font-weight: 700;
		color: #0f172a;
	}

	.worker-name-cell {
		font-size: 0.95rem;
		font-weight: 800;
		text-transform: capitalize;
	}

	.rate-cell {
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
	}

	.subtotal-cell {
		font-size: 0.825rem;
		font-weight: 700;
	}

	.total-gaji-cell {
		background-color: #f1f5f9 !important;
		font-size: 1.05rem;
		color: #0f172a;
		font-weight: 800;
		padding-right: 0.75rem;
	}

	.grand-total-row td {
		background-color: #e2e8f0 !important;
		border: 2px solid #0f172a !important;
		padding: 0.75rem 0.75rem;
	}

	.grand-label-cell {
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.grand-val-cell {
		font-size: 1.25rem;
		color: #0f172a;
	}

	.empty-cell {
		text-align: center;
		padding: 2.5rem;
		color: var(--text-muted);
	}

	/* Signatures */
	.sheet-signatures {
		display: flex;
		justify-content: space-between;
		margin-top: 2.5rem;
		padding: 0 2rem;
	}

	.sig-box {
		text-align: center;
		width: 200px;
	}

	.sig-space {
		height: 60px;
	}

	.sig-name {
		font-weight: 700;
		border-top: 1px dotted #0f172a;
		padding-top: 0.4rem;
		font-size: 0.85rem;
	}

	/* Print styles */
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		.no-print {
			display: none !important;
		}

		.payroll-sheet-wrapper {
			border: none !important;
			box-shadow: none !important;
			padding: 0 !important;
			margin: 0 !important;
			width: 100% !important;
		}

		.sheet-top-meta {
			border-bottom: 2px solid black !important;
			padding-bottom: 0.5rem !important;
			margin-bottom: 0.75rem !important;
		}

		.sheet-table th, .sheet-table td {
			border: 1px solid black !important;
			padding: 3px 4px !important;
			font-size: 8.5pt !important;
		}

		.sheet-table th {
			background-color: #e5e5e5 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.grand-total-row td {
			background-color: #d4d4d4 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			font-size: 10pt !important;
		}

		.sheet-signatures {
			margin-top: 2rem !important;
			page-break-inside: avoid;
		}

		.sig-space {
			height: 50px !important;
		}

		@page {
			size: landscape;
			margin: 0.8cm;
		}
	}
</style>
