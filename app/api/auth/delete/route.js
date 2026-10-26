import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, verifyPassword } from '@/lib/auth';

export async function DELETE(request) {
  try {
    const token = request.cookies.get('jwt')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.type === 'impersonation' || ['admin', 'super_admin'].includes(payload.role)) return NextResponse.json({ error: 'Administrator accounts must be managed by another administrator' }, { status: 403 });
    const body = await request.json();
    const account = await query('SELECT password_hash FROM users WHERE id = $1', [payload.sub]);
    if (typeof body.password !== 'string' || !account.rowCount || !await verifyPassword(body.password, account.rows[0].password_hash)) return NextResponse.json({ error: 'Current password is required' }, { status: 403 });
    const owners = await query("SELECT user_id FROM organization_members WHERE user_id = $1 AND role = 'owner' AND status = 'active'", [payload.sub]);
    if (owners.rowCount) return NextResponse.json({ error: 'Transfer organization ownership before deleting your account' }, { status: 409 });
    await query('DELETE FROM users WHERE id = $1', [payload.sub]);

    const response = NextResponse.json({ success: true });
    response.cookies.delete('jwt');
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
