import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query, runWithDbContext } from '@/lib/db';
export async function POST(request) {
  const user = await getAuthUser(request);
  if (user) await runWithDbContext({ role: 'service' }, () => query('UPDATE users SET auth_version = auth_version + 1 WHERE id = $1', [user.sub]));
  const response = NextResponse.json({ success: true });
  response.cookies.set('jwt', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
