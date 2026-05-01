import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const { rows } = await pool.query(
      'SELECT username FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (rows.length > 0) {
      return NextResponse.json(rows[0]);
    }
    return NextResponse.json({ error: 'Wrong credentials' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
