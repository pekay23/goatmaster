import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request) {
  try {
    const token = request.cookies.get('jwt')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await query('DELETE FROM users WHERE id = $1', [payload.sub]);

    const response = NextResponse.json({ success: true });
    response.cookies.delete('jwt');
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
