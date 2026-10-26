import { NextResponse } from 'next/server';
import { getAuthUser, verifyPassword, hashPassword, signToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await query('SELECT id, username, email, role, preferences FROM users WHERE id = $1', [user.sub]);
  const organization = await query('SELECT id, name, tier, subscription_status, current_period_end FROM organizations WHERE id = $1', [user.orgId]);
  const payments = await query('SELECT reference, amount, status, created_at FROM payments WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50', [user.orgId]);
  return NextResponse.json({ user: profile.rows[0], organization: organization.rows[0], payments: payments.rows });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId || user.type === 'impersonation') return NextResponse.json({ error: 'Sign in with your own account to change settings' }, { status: 403 });
  const body = await request.json();
  if (body.newPassword !== undefined) {
    if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string' || body.newPassword.length < 10 || new TextEncoder().encode(body.newPassword).length > 72) {
      return NextResponse.json({ error: 'Enter your current password and a new password of 10 characters or more, up to 72 bytes' }, { status: 400 });
    }
    const record = await query('SELECT password_hash FROM users WHERE id = $1', [user.sub]);
    if (!record.rowCount || !await verifyPassword(body.currentPassword, record.rows[0].password_hash)) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    const updated = await query('UPDATE users SET password_hash = $1, auth_version = auth_version + 1 WHERE id = $2 RETURNING auth_version', [await hashPassword(body.newPassword), user.sub]);
    const token = await signToken({ sub: user.sub, email: user.email, role: user.role, orgId: user.orgId, sessionVersion: updated.rows[0].auth_version });
    const response = NextResponse.json({ success: true });
    response.cookies.set('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
    return response;
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username || username.length > 100) return NextResponse.json({ error: 'Name must contain 1 to 100 characters' }, { status: 400 });
  await query('UPDATE users SET username = $1 WHERE id = $2', [username, user.sub]);
  return NextResponse.json({ success: true });
}
