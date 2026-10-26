import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission } from './admin-auth';
import { verifyToken as verifySession } from './auth';
export async function verifyToken(token: string) { return verifySession(token); }
export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;
  const user = token ? await verifySession(token) : null;
  return { allowed: hasAdminPermission(user, 'overview:read'), user };
}
export function adminDenied(pathname: string, requestUrl: URL) { return pathname.startsWith('/api/') ? NextResponse.json({ error: 'Admin access required' }, { status: 403 }) : NextResponse.redirect(new URL('/login?app=admin', requestUrl)); }
