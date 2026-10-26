import { listRecords } from '../_listing';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError } from '../_records';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, 'herd')); }
  catch (error) { return apiError(error, 'Unable to load records'); }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id } = body;
    const status=body.status??'active';
    if(!['active','pregnant','for_sale','sold','deceased'].includes(status))return NextResponse.json({error:'Invalid animal status'},{status:400});

    if (typeof name !== 'string' || !name.trim() || !['male', 'female', 'unknown'].includes(sex)) {
      return NextResponse.json({ error: 'Name and sex are required' }, { status: 400 });
    }

    const parentIds = [dam_id, sire_id].filter(Boolean);
    if (parentIds.length) {
      const parents = await query('SELECT id FROM goats WHERE id = ANY($1::uuid[]) AND organization_id = $2', [parentIds, user.orgId]);
      if (parents.rows.length !== new Set(parentIds).size) return NextResponse.json({ error: 'Parents must belong to this organization' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO goats (organization_id, name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id, status, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $11, $10)
       RETURNING *`,
      [user.orgId, name, breed || null, sex, dob || null, ear_tag || null, image_url || null, dam_id || null, sire_id || null, user.sub,status]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return apiError(err, 'Failed to create goat');
  }
}
