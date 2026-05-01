import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request) {
  try {
    const { username } = await request.json();
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    return NextResponse.json({ message: 'Account deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
