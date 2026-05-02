import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { sanitiseString, requireFields } from '@/lib/validate';

// Rate limit: 10 attempts per IP per 15 minutes
const attempts = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const entry = attempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > window) { attempts.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= 10) return true;
  entry.count++;
  attempts.set(ip, entry);
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many login attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const body = await request.json();
    const err = requireFields(body, ['username', 'password']);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const username = sanitiseString(body.username, 50).toLowerCase();
    const password = body.password;

    const { rows } = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );

    // Always run bcrypt even if user not found (prevents timing attacks)
    const dummyHash = '$2b$12$invalidhashtopreventtimingattack000000000000000000000';
    const hash = rows[0]?.password ?? dummyHash;
    const valid = await bcrypt.compare(password, hash);

    if (!valid || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await signToken({ userId: rows[0].id, username: rows[0].username });
    const response = NextResponse.json({ username: rows[0].username });
    return setAuthCookie(response, token);
  } catch (err) {
    console.error('[login]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
