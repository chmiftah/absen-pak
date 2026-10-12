import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require', max: 5 });

async function init() {
  console.log("🚀 Initializing database tables with prefix 'absen_'...");

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS absen_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nama VARCHAR(150) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'KARYAWAN',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS absen_jabatan (
      id SERIAL PRIMARY KEY,
      nama_jabatan VARCHAR(100) NOT NULL,
      keterangan TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS absen_projek (
      id SERIAL PRIMARY KEY,
      nama_projek VARCHAR(150) NOT NULL,
      lokasi VARCHAR(255),
      status VARCHAR(20) DEFAULT 'AKTIF',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS absen_karyawan (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES absen_users(id) ON DELETE SET NULL,
      jabatan_id INTEGER REFERENCES absen_jabatan(id) ON DELETE SET NULL,
      nama VARCHAR(150) NOT NULL,
      no_hp VARCHAR(50),
      rate_harian NUMERIC(12, 2) NOT NULL DEFAULT 0,
      rate_lembur_jam NUMERIC(12, 2) NOT NULL DEFAULT 0,
      rate_lembur_hari NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status_aktif BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS absen_kehadiran (
      id SERIAL PRIMARY KEY,
      karyawan_id INTEGER NOT NULL REFERENCES absen_karyawan(id) ON DELETE CASCADE,
      projek_id INTEGER NOT NULL REFERENCES absen_projek(id) ON DELETE CASCADE,
      tanggal DATE NOT NULL,
      hadir_harian NUMERIC(4, 2) NOT NULL DEFAULT 0,
      lembur_jam NUMERIC(4, 2) NOT NULL DEFAULT 0,
      lembur_hari NUMERIC(4, 2) NOT NULL DEFAULT 0,
      keterangan TEXT,
      snapshot_rate_harian NUMERIC(12, 2) NOT NULL DEFAULT 0,
      snapshot_rate_lembur_jam NUMERIC(12, 2) NOT NULL DEFAULT 0,
      snapshot_rate_lembur_hari NUMERIC(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uniq_karyawan_projek_tanggal UNIQUE (karyawan_id, projek_id, tanggal)
    );
  `;

  console.log("✅ Tables created successfully!");

  // Seed Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const workerPassword = await bcrypt.hash('123456', 10);

  const [adminUser] = await sql`
    INSERT INTO absen_users (username, password_hash, nama, role)
    VALUES ('admin', ${adminPassword}, 'Administrator Proyek', 'ADMIN')
    ON CONFLICT (username) DO UPDATE 
    SET password_hash = EXCLUDED.password_hash
    RETURNING id;
  `;
  console.log(`👤 Admin created/ready (ID: ${adminUser.id})`);

  // Seed Jabatan
  const jabatans = [
    { nama: 'Tukang Batu', keterangan: 'Pekerjaan pasangan bata, plester, aci' },
    { nama: 'Tukang Kayu', keterangan: 'Bekisting dan plafon' },
    { nama: 'Tukang Besi', keterangan: 'Pembesian dan rakitan cor' },
    { nama: 'Kenek / Laden', keterangan: 'Pembantu tukang dan adukan' },
    { nama: 'Mandor', keterangan: 'Pengawas harian lapangan' }
  ];

  const jabatanMap = {};
  for (const j of jabatans) {
    const [row] = await sql`
      INSERT INTO absen_jabatan (nama_jabatan, keterangan)
      VALUES (${j.nama}, ${j.keterangan})
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;
    if (row) {
      jabatanMap[j.nama] = row.id;
    } else {
      const [existing] = await sql`SELECT id FROM absen_jabatan WHERE nama_jabatan = ${j.nama}`;
      jabatanMap[j.nama] = existing?.id;
    }
  }

  // Seed Project from photo: "con cat"
  let [projek] = await sql`
    INSERT INTO absen_projek (nama_projek, lokasi, status)
    VALUES ('Con Cat', 'Area Proyek Utama', 'AKTIF')
    RETURNING id;
  `;
  if (!projek) {
    const [existing] = await sql`SELECT id FROM absen_projek WHERE nama_projek = 'Con Cat'`;
    projek = existing;
  }
  console.log(`🏗️ Project 'Con Cat' ready (ID: ${projek.id})`);

  // Seed Workers from user's sheet:
  // Wahlan (100k, 15k, 100k), Triyono (100k, 15k, 100k), Rio (90k, 15k, 90k), Sigit (90k, 15k, 90k),
  // Toni (90k, 15k, 90k), Vito (90k, 15k, 90k), Warid (100k, 15k, 100k)
  const workers = [
    { nama: 'Wahlan', username: 'wahlan', jabatan: 'Tukang Batu', harian: 100000, lemburJam: 15000, lemburHari: 100000 },
    { nama: 'Triyono', username: 'triyono', jabatan: 'Tukang Batu', harian: 100000, lemburJam: 15000, lemburHari: 100000 },
    { nama: 'Rio', username: 'rio', jabatan: 'Kenek / Laden', harian: 90000, lemburJam: 15000, lemburHari: 90000 },
    { nama: 'Sigit', username: 'sigit', jabatan: 'Kenek / Laden', harian: 90000, lemburJam: 15000, lemburHari: 90000 },
    { nama: 'Toni', username: 'toni', jabatan: 'Kenek / Laden', harian: 90000, lemburJam: 15000, lemburHari: 90000 },
    { nama: 'Vito', username: 'vito', jabatan: 'Kenek / Laden', harian: 90000, lemburJam: 15000, lemburHari: 90000 },
    { nama: 'Warid', username: 'warid', jabatan: 'Tukang Kayu', harian: 100000, lemburJam: 15000, lemburHari: 100000 }
  ];

  const workerMap = {};
  for (const w of workers) {
    // create user
    const [user] = await sql`
      INSERT INTO absen_users (username, password_hash, nama, role)
      VALUES (${w.username}, ${workerPassword}, ${w.nama}, 'KARYAWAN')
      ON CONFLICT (username) DO UPDATE SET nama = EXCLUDED.nama
      RETURNING id;
    `;

    // create or update employee
    const [karyawan] = await sql`
      INSERT INTO absen_karyawan (user_id, jabatan_id, nama, no_hp, rate_harian, rate_lembur_jam, rate_lembur_hari, status_aktif)
      VALUES (${user.id}, ${jabatanMap[w.jabatan] || null}, ${w.nama}, '08123456789', ${w.harian}, ${w.lemburJam}, ${w.lemburHari}, true)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;
    if (karyawan) {
      workerMap[w.nama] = { id: karyawan.id, harian: w.harian, lemburJam: w.lemburJam, lemburHari: w.lemburHari };
    } else {
      const [existing] = await sql`SELECT id FROM absen_karyawan WHERE nama = ${w.nama}`;
      workerMap[w.nama] = { id: existing.id, harian: w.harian, lemburJam: w.lemburJam, lemburHari: w.lemburHari };
    }
  }
  console.log("👷 Karyawan created/ready!");

  // Date period matching photo: 10-10-26 (Minggu 2026-10-04 s/d Sabtu 2026-10-10)
  // Minggu: 2026-10-04
  // Senin: 2026-10-05
  // Selasa: 2026-10-06
  // Rabu: 2026-10-07
  // Kamis: 2026-10-08
  // Jumat: 2026-10-09
  // Sabtu: 2026-10-10
  const dates = {
    minggu: '2026-10-04',
    senin: '2026-10-05',
    selasa: '2026-10-06',
    rabu: '2026-10-07',
    kamis: '2026-10-08',
    jumat: '2026-10-09',
    sabtu: '2026-10-10'
  };

  // Sample records from the photo sheet:
  const attendanceData = [
    // Wahlan: Sel (H=1, LH=1), Rab (H=1), Kam (H=1, LH=1), Jum (H=1, LJ=3), Sab (H=1, LJ=2)
    { nama: 'Wahlan', day: 'selasa', h: 1, lj: 0, lh: 1 },
    { nama: 'Wahlan', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Wahlan', day: 'kamis', h: 1, lj: 0, lh: 1 },
    { nama: 'Wahlan', day: 'jumat', h: 1, lj: 3, lh: 0 },
    { nama: 'Wahlan', day: 'sabtu', h: 1, lj: 2, lh: 0 },

    // Triyono: Sen-Sab H=1, LJ: Sen 2, Sel 2, Kam 2, Jum 2, Sab 2
    { nama: 'Triyono', day: 'senin', h: 1, lj: 2, lh: 0 },
    { nama: 'Triyono', day: 'selasa', h: 1, lj: 2, lh: 0 },
    { nama: 'Triyono', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Triyono', day: 'kamis', h: 1, lj: 2, lh: 0 },
    { nama: 'Triyono', day: 'jumat', h: 1, lj: 2, lh: 0 },
    { nama: 'Triyono', day: 'sabtu', h: 1, lj: 2, lh: 0 },

    // Rio: Sen (H=1, LJ=2), Sel (H=1, LH=1), Rab (H=1), Kam (H=1, LH=1)
    { nama: 'Rio', day: 'senin', h: 1, lj: 2, lh: 0 },
    { nama: 'Rio', day: 'selasa', h: 1, lj: 0, lh: 1 },
    { nama: 'Rio', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Rio', day: 'kamis', h: 1, lj: 0, lh: 1 },

    // Sigit: Sen-Sab H=1, LJ: Sen 2, Sel 2, Kam 2, Jum 2, Sab 2
    { nama: 'Sigit', day: 'senin', h: 1, lj: 2, lh: 0 },
    { nama: 'Sigit', day: 'selasa', h: 1, lj: 2, lh: 0 },
    { nama: 'Sigit', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Sigit', day: 'kamis', h: 1, lj: 2, lh: 0 },
    { nama: 'Sigit', day: 'jumat', h: 1, lj: 2, lh: 0 },
    { nama: 'Sigit', day: 'sabtu', h: 1, lj: 2, lh: 0 },

    // Toni: Min-Sab H=1 (7), LJ: Min 2, Jum 3, Sab 2 (7 jam), LH: Sel 1, Kam 1 (2 hari)
    { nama: 'Toni', day: 'minggu', h: 1, lj: 2, lh: 0 },
    { nama: 'Toni', day: 'senin', h: 1, lj: 0, lh: 0 },
    { nama: 'Toni', day: 'selasa', h: 1, lj: 0, lh: 1 },
    { nama: 'Toni', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Toni', day: 'kamis', h: 1, lj: 0, lh: 1 },
    { nama: 'Toni', day: 'jumat', h: 1, lj: 3, lh: 0 },
    { nama: 'Toni', day: 'sabtu', h: 1, lj: 2, lh: 0 },

    // Vito: Min-Sab H=1 (7), LJ: Min 2, Jum 2, Sab 2 (6 jam), LH: Sel 1, Kam 1 (2 hari)
    { nama: 'Vito', day: 'minggu', h: 1, lj: 2, lh: 0 },
    { nama: 'Vito', day: 'senin', h: 1, lj: 0, lh: 0 },
    { nama: 'Vito', day: 'selasa', h: 1, lj: 0, lh: 1 },
    { nama: 'Vito', day: 'rabu', h: 1, lj: 0, lh: 0 },
    { nama: 'Vito', day: 'kamis', h: 1, lj: 0, lh: 1 },
    { nama: 'Vito', day: 'jumat', h: 1, lj: 2, lh: 0 },
    { nama: 'Vito', day: 'sabtu', h: 1, lj: 2, lh: 0 },

    // Warid: Jum (H=1, LJ=2), Sab (H=1, LJ=2)
    { nama: 'Warid', day: 'jumat', h: 1, lj: 2, lh: 0 },
    { nama: 'Warid', day: 'sabtu', h: 1, lj: 2, lh: 0 }
  ];

  for (const item of attendanceData) {
    const worker = workerMap[item.nama];
    const tgl = dates[item.day];
    await sql`
      INSERT INTO absen_kehadiran (
        karyawan_id, projek_id, tanggal, hadir_harian, lembur_jam, lembur_hari,
        snapshot_rate_harian, snapshot_rate_lembur_jam, snapshot_rate_lembur_hari
      )
      VALUES (
        ${worker.id}, ${projek.id}, ${tgl}, ${item.h}, ${item.lj}, ${item.lh},
        ${worker.harian}, ${worker.lemburJam}, ${worker.lemburHari}
      )
      ON CONFLICT (karyawan_id, projek_id, tanggal) DO UPDATE SET
        hadir_harian = EXCLUDED.hadir_harian,
        lembur_jam = EXCLUDED.lembur_jam,
        lembur_hari = EXCLUDED.lembur_hari,
        snapshot_rate_harian = EXCLUDED.snapshot_rate_harian,
        snapshot_rate_lembur_jam = EXCLUDED.snapshot_rate_lembur_jam,
        snapshot_rate_lembur_hari = EXCLUDED.snapshot_rate_lembur_hari;
    `;
  }
  console.log("📝 Seed data for week 10-10-26 successfully inserted!");

  await sql.end();
  console.log("🎉 Database initialization completed successfully!");
}

init().catch((err) => {
  console.error("❌ Error initializing DB:", err);
  process.exit(1);
});
