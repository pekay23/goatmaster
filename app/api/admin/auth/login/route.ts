import { allowAuthAttempt } from '@/lib/auth-rate-limit';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || !password || new TextEncoder().encode(password).length > 72) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!await allowAuthAttempt(email, 'login')) return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    const result = await query(
      'SELECT id, email, password_hash, username, role, organization_id, auth_version FROM users WHERE LOWER(email) = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!['admin', 'super_admin', 'support', 'billing'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.auth_version, orgId: user.organization_id,
    });

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    response.cookies.set('admin_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
