import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Return basic user info for settings
    return NextResponse.json({
      id: user.sub,
      username: user.username,
      email: user.email,
      role: user.role,
      tier: user.tier,
      orgId: user.orgId,
    });
  } catch (err) {
    console.error('Settings user error:', err);
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Handle settings updates
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}