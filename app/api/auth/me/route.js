import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('jwt')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { rows } = await query('SELECT id, email, username, role, tier FROM users WHERE id = $1', [payload.sub]);
    if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
