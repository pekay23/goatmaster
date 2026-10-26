import { featureAccessError } from '@/lib/plan-access';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const denied = await featureAccessError(request, 'health_records'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query(
    `SELECT hr.*, g.name AS goat_name FROM health_records hr
     JOIN goats g ON g.id = hr.goat_id AND g.organization_id = hr.organization_id
     WHERE hr.organization_id = $1 AND hr.next_due_date IS NOT NULL
       AND hr.next_due_date <= NOW() + INTERVAL '30 days'
     ORDER BY hr.next_due_date ASC`,
    [user.orgId]
  );
  return NextResponse.json({ records: result.rows });
}
