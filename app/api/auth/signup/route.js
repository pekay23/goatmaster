import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    return NextResponse.json({ message: 'Account created' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
