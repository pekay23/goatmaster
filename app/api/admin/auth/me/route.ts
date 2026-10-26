import { NextResponse } from 'next/server';
import { adminPermissions, getAdminUser } from '@/lib/admin-auth';
export async function GET(request: Request) {
  const user = await getAdminUser(request);
  const permissions = adminPermissions(user);
  if (!user || !permissions.length) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  return NextResponse.json({ id: user.sub, email: user.email, username: user.username, role: user.role, permissions });
}
