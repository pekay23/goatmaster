import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Temporary credential recovery — will be deleted after use
export async function POST(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { rows } = await pool.query('SELECT username, password FROM users');
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
