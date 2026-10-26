import { allowAuthAttempt } from '@/lib/auth-rate-limit';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || !password || new TextEncoder().encode(password).length > 72) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    if (!await allowAuthAttempt(email, 'login')) return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    const { rows } = await query('SELECT id, email, username, role, tier, organization_id, auth_version, password_hash FROM users WHERE LOWER(email) = $1', [String(email).trim().toLowerCase()]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, email: user.email, role: user.role, sessionVersion: user.auth_version, orgId: user.organization_id });
    const { password_hash, ...safeUser } = user;

    const response = NextResponse.json({ data: safeUser });
    response.cookies.set('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });
    
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
