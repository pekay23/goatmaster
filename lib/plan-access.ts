import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasFeature, type Tier } from '@/lib/plan-entitlements';

export async function featureAccessError(request: Request, feature: string): Promise<NextResponse | null> {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query('SELECT tier, smart_scan_enabled FROM organizations WHERE id = $1', [user.orgId]);
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const tier = String(row.tier || 'free').toLowerCase() as Tier;
  const enabled = feature === 'smart_scan' ? row.smart_scan_enabled === true : hasFeature(tier, feature);
  return enabled ? null : NextResponse.json({ error: 'This feature requires a plan upgrade', required_tier: 'basic' }, { status: 403 });
}
