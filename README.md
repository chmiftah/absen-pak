# 🔨 AbsenPak - Sistem Absensi Mandiri & Laporan Penggajian Proyek

Aplikasi web modern berbasis **SvelteKit** dan **PostgreSQL (Neon Serverless)** yang dirancang untuk pencatatan absensi tukang proyek secara mandiri serta otomatisasi rekapitulasi penggajian dengan format matrix yang **persis sama dengan lembar catatan fisik lapangan**.

---

## 🚀 Fitur Utama

### 1. 👷 Portal Absen Mandiri (Pekerja / Tukang)
- **Mobile-friendly**: Sangat mudah digunakan dari HP oleh tukang di lapangan.
- **Pilihan Komponen Absensi**:
  - **Harian Normal**: 1 hari kerja standar.
  - **Lembur Jam**: Input jam lembur (dihitung per jam).
  - **Lembur Hari Penuh**: Lembur 1 hari tambahan (sesuai kebutuhan lapangan).
- **Kalkulator Upah Real-time**: Tukang langsung melihat estimasi upah hari itu di layar.
- **Riwayat Mandiri (`/absen/riwayat`)**: Tukang dapat memantau kehadiran dan total penghasilan per bulan.

### 2. 🛡️ Keamanan Rate Historis (Snapshot System)
- Tarif upah disimpan sebagai snapshot saat absensi dicatat (`snapshot_rate_harian`, `snapshot_rate_lembur_jam`, `snapshot_rate_lembur_hari`).
- Jika Admin mengubah rate master karyawan di kemudian hari, **laporan gaji dan absensi bulan-bulan sebelumnya tetap 100% aman dan tidak berubah**.

### 3. 📊 Portal Admin & Mandor
- **Dashboard**: Statistik kehadiran tukang hari ini, total proyek, dan total karyawan aktif.
- **Master Data**:
  - **Proyek (`/admin/proyek`)**: Kelola lokasi dan status proyek.
  - **Karyawan & Rate (`/admin/karyawan`)**: Kelola pekerja, jabatan, serta penyesuaian rate harian/lembur.
  - **Jabatan**: Master jabatan (Tukang Batu, Tukang Besi, Tukang Kayu, Kenek/Laden, dll).
- **Rekap & Koreksi Absen (`/admin/absen`)**: Verifikasi dan koreksi absensi lapangan jika ada tukang yang tidak membawa HP.
- **Laporan Penggajian Matrix (`/admin/laporan`)**:
  - Format tabel 3 baris per pekerja (`HARIAN`, `LEMBUR JAM`, `LEMBUR HARI`) persis seperti lembar kertas Anda.
  - Filter Mingguan (default 7 hari), Bulanan, atau Rentang Tanggal Bebas.
  - Kolom Hari: Minggu s/d Sabtu, Jml, Gaji/Rate, Sub Total, Total Gaji, dan Grand Total.
  - **Tombol Cetak / PDF (`window.print()`)**: Format landscape bersih siap cetak resmi.

---

## 🔑 Akun Demo / Uji Coba

Aplikasi telah disiapkan dengan tombol *1-Click Demo Login* di halaman `/login`:

| Peran | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses penuh dashboard, master data, dan laporan |
| **Tukang (Wahlan)** | `wahlan` | `123456` | Tukang Batu (Rate Harian 100k, Lembur Jam 15k, Lembur Hari 100k) |
| **Tukang (Triyono)** | `triyono` | `123456` | Tukang Batu (Rate Harian 100k, Lembur Jam 15k, Lembur Hari 100k) |
| **Tukang (Rio)** | `rio` | `123456` | Kenek / Laden (Rate Harian 90k, Lembur Jam 15k, Lembur Hari 90k) |
| **Tukang (Sigit)** | `sigit` | `123456` | Kenek / Laden (Rate Harian 90k, Lembur Jam 15k, Lembur Hari 90k) |
| **Tukang (Toni)** | `toni` | `123456` | Kenek / Laden (Rate Harian 90k, Lembur Jam 15k, Lembur Hari 90k) |
| **Tukang (Vito)** | `vito` | `123456` | Kenek / Laden (Rate Harian 90k, Lembur Jam 15k, Lembur Hari 90k) |
| **Tukang (Warid)** | `warid` | `123456` | Tukang Kayu (Rate Harian 100k, Lembur Jam 15k, Lembur Hari 100k) |

*Data absensi periode 04-10-2026 s/d 10-10-2026 telah diisi sesuai data foto kertas fisik Anda (Total Gaji: Rp 4.860.000).*

---

## 💻 Menjalankan Aplikasi

```bash
# Masuk ke direktori
cd /Users/user/development/absenPak

# Jalankan server development
npm run dev -- --port 5174
```

Akses di browser: **[http://localhost:5174](http://localhost:5174)**
