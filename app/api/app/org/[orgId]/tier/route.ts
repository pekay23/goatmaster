import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  
  // Verify user belongs to this org
  if (user.orgId !== orgId && user.role !== 'admin' && user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await query(
      `SELECT o.tier, t.max_goats, t.max_scans_per_day, t.ai_training_enabled, t.smart_scan_enabled
       FROM organizations o
       JOIN tiers t ON t.id = o.tier
       WHERE o.id = $1`,
      [orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Org tier error:', err);
    return NextResponse.json({ error: 'Failed to load tier' }, { status: 500 });
  }
}