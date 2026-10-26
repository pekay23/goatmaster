import { allowAuthAttempt } from '@/lib/auth-rate-limit';
import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !username || username.length > 100 || password.length < 10 || new TextEncoder().encode(password).length > 72) {
      return NextResponse.json({ error: 'Provide a valid email, username, and password of at least 10 characters' }, { status: 400 });
    }
    if (!await allowAuthAttempt(email, 'signup')) return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    const passwordHash = await hashPassword(password);
    client = await getClient();
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO users (email, password_hash, username, role, tier)
       VALUES ($1, $2, $3, 'user', 'free') RETURNING id, email, username, role, tier`,
      [email, passwordHash, username]
    );
    const user = inserted.rows[0];
    const baseSlug = username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180) || 'farm';
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, tier) VALUES ($1, $2 || '-' || $3, 'free') RETURNING id`,
      [username, baseSlug, user.id.replaceAll('-', '').slice(0, 12)]
    );
    const orgId = orgResult.rows[0].id;
    await client.query('UPDATE users SET organization_id = $1 WHERE id = $2', [orgId, user.id]);
    await client.query(`INSERT INTO organization_members (organization_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')`, [orgId, user.id]);
    await client.query('COMMIT');
    const token = await signToken({ sub: user.id, email: user.email, role: user.role, orgId });
    const response = NextResponse.json({ data: { ...user, organization_id: orgId } }, { status: 201 });
    response.cookies.set('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
    return response;
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (err?.code === '23505') return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 });
  } finally {
    client?.release();
  }
}
