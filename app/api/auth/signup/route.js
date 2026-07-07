import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, username } = await request.json();
    
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, role, tier`,
      [email, password_hash, username]
    );

    const user = rows[0];
    const token = await signToken({ sub: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ data: user });
    response.cookies.set('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });
    
    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
