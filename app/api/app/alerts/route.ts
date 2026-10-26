import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query(
    `SELECT * FROM alerts WHERE organization_id = $1 OR (organization_id IS NULL AND owner_id = $2)
     ORDER BY created_at DESC LIMIT 50`,
    [user.orgId, user.sub]
  );
  return NextResponse.json(result.rows);
}
