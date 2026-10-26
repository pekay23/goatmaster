import { featureAccessError } from '@/lib/plan-access';
import { listRecords } from '../_listing';
import { apiError } from '../_records';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

const statuses = ['planned', 'mated', 'confirmed', 'kidded', 'failed'];

export async function GET(request: Request) {
  const denied = await featureAccessError(request, 'breeding'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, 'breeding')); }
  catch (error) { return apiError(error, 'Unable to load records'); }
}

export async function POST(request: Request) {
  const denied = await featureAccessError(request, 'breeding'); if (denied) return denied;
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const damId = typeof body.dam_id === 'string' ? body.dam_id : '';
    const sireId = typeof body.sire_id === 'string' && body.sire_id ? body.sire_id : null;
    const status = body.status || 'planned';
    const kidsCount = Number(body.kids_count ?? 0);
    if (!damId) return NextResponse.json({ error: 'A dam is required' }, { status: 400 });
    if (!statuses.includes(status)) return NextResponse.json({ error: 'Invalid breeding status' }, { status: 400 });
    if (!Number.isInteger(kidsCount) || kidsCount < 0) return NextResponse.json({ error: 'Kids count must be a non-negative integer' }, { status: 400 });
    const parentIds = [damId, sireId].filter(Boolean);
    const parents = await query('SELECT id FROM goats WHERE id = ANY($1::uuid[]) AND organization_id = $2', [parentIds, user.orgId]);
    if (parents.rows.length !== parentIds.length) return NextResponse.json({ error: 'Parents must belong to this organization' }, { status: 400 });
    const result = await query(
      `INSERT INTO breeding_records (owner_id, organization_id, dam_id, sire_id, mating_date, expected_kidding_date, actual_kidding_date, kids_count, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user.sub, user.orgId, damId, sireId, body.mating_date || null, body.expected_kidding_date || null, body.actual_kidding_date || null, kidsCount, body.notes || null, status]
    );
    return NextResponse.json({ record: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create breeding record error:', error);
    return NextResponse.json({ error: 'Unable to create breeding record' }, { status: 500 });
  }
}
