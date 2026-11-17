import 'dotenv/config';
import postgres from 'postgres';

const connStr = process.env.DATABASE_URL;
const sql = postgres(connStr, { ssl: 'require', connect_timeout: 15 });

async function migrate() {
  console.log("🚀 Creating table 'absen_bon'...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS absen_bon (
        id SERIAL PRIMARY KEY,
        projek_id INTEGER NOT NULL REFERENCES absen_projek(id) ON DELETE CASCADE,
        karyawan_id INTEGER NOT NULL REFERENCES absen_karyawan(id) ON DELETE CASCADE,
        tanggal DATE NOT NULL,
        jam VARCHAR(10) NOT NULL,
        nominal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        keterangan TEXT,
        created_by INTEGER REFERENCES absen_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_absen_bon_projek_tanggal ON absen_bon(projek_id, tanggal);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_absen_bon_karyawan ON absen_bon(karyawan_id);
    `;

    console.log("✅ Table 'absen_bon' created successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

migrate();
