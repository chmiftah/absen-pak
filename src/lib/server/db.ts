import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import 'dotenv/config';

const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured in environment");
}

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20
});
