import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';
import { sql } from './db';
import crypto from 'crypto';
import { env } from '$env/dynamic/private';

const SECRET = env.JWT_SECRET || process.env.JWT_SECRET || 'absenpak-secret-signature-key-2026';
const COOKIE_NAME = 'absen_session';

export interface UserSession {
  id: number;
  username: string;
  nama: string;
  role: 'ADMIN' | 'KARYAWAN';
  karyawan_id?: number;
  jabatan_id?: number;
  nama_jabatan?: string;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  return hmac.digest('hex');
}

export function createSessionCookie(cookies: Cookies, user: { id: number; role: string }) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, t: Date.now() })).toString('base64');
  const signature = sign(payload);
  const value = `${payload}.${signature}`;

  cookies.set(COOKIE_NAME, value, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export function clearSessionCookie(cookies: Cookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function getUserFromSession(cookies: Cookies): Promise<UserSession | null> {
  const cookieVal = cookies.get(COOKIE_NAME);
  if (!cookieVal) return null;

  const parts = cookieVal.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (sign(payload) !== signature) {
    return null; // invalid signature
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (!data.id) return null;

    const [user] = await sql`
      SELECT 
        u.id, u.username, u.nama, u.role,
        k.id as karyawan_id, k.jabatan_id,
        j.nama_jabatan
      FROM absen_users u
      LEFT JOIN absen_karyawan k ON k.user_id = u.id
      LEFT JOIN absen_jabatan j ON j.id = k.jabatan_id
      WHERE u.id = ${data.id}
      LIMIT 1;
    `;

    if (!user) return null;
    return user as UserSession;
  } catch (err) {
    return null;
  }
}
