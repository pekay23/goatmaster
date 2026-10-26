import { featureAccessError } from '@/lib/plan-access';
import { listRecords } from '../_listing';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError } from '../_records';

export async function GET(request: Request) {
  const denied = await featureAccessError(request, 'health_records'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, 'health')); }
  catch (error) { return apiError(error, 'Unable to load records'); }
}

export async function POST(request: Request) {
  const denied = await featureAccessError(request, 'health_records'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goat_id, type, notes, treatment, cost, record_date, next_due_date } = body;

    if (!goat_id || !type) {
      return NextResponse.json({ error: 'Goat and type are required' }, { status: 400 });
    }

    const goat = await query('SELECT id FROM goats WHERE id = $1 AND organization_id = $2', [goat_id, user.orgId]);
    if (!goat.rows.length) return NextResponse.json({ error: 'Goat not found in this organization' }, { status: 404 });

    const result = await query(
      `INSERT INTO health_records (owner_id, organization_id, goat_id, type, notes, treatment, cost, record_date, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.sub, user.orgId, goat_id, type, notes, treatment, cost || 0, record_date || new Date().toISOString(), next_due_date || null]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return apiError(err, 'Failed to create record');
  }
}
