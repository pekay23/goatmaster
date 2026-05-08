import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { sanitiseString, requireFields } from '@/lib/validate';

// Simple in-memory rate limit: max 5 signups per IP per 10 minutes
const attempts = new Map();
let _rlCleanupCounter = 0;
function rateLimit(ip) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  // Prune expired entries every 100 calls to prevent memory leak
  if (++_rlCleanupCounter >= 100) {
    _rlCleanupCounter = 0;
    for (const [key, entry] of attempts) {
      if (now - entry.start > window) attempts.delete(key);
    }
  }
  const entry = attempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > window) { attempts.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= 5) return true;
  entry.count++;
  attempts.set(ip, entry);
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const err = requireFields(body, ['username', 'password']);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const username = sanitiseString(body.username, 50).toLowerCase();
    const password = body.password;

    if (username.length < 3) return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    const token = await signToken({ userId: rows[0].id, username: rows[0].username, role: 'user', tier: 'free' });
    const response = NextResponse.json({ username: rows[0].username, role: 'user', tier: 'free' });
    return setAuthCookie(response, token);
  } catch (err) {
    console.error('[signup]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
