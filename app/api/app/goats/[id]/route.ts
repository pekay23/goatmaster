import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query(
      'SELECT * FROM goats WHERE id = $1 AND organization_id = $2',
      [id, user.orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Goat not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Get goat error:', err);
    return NextResponse.json({ error: 'Failed to load goat' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id, status } = body;

    const result = await query(
      `UPDATE goats 
       SET name = COALESCE($1, name),
           breed = COALESCE($2, breed),
           sex = COALESCE($3, sex),
           dob = COALESCE($4, dob),
           ear_tag = COALESCE($5, ear_tag),
           image_url = COALESCE($6, image_url),
           dam_id = COALESCE($7, dam_id),
           sire_id = COALESCE($8, sire_id),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $10 AND organization_id = $11
       RETURNING *`,
      [name, breed, sex, dob, ear_tag, image_url, dam_id, sire_id, status, id, user.orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Goat not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Update goat error:', err);
    return NextResponse.json({ error: 'Failed to update goat' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query(
      'DELETE FROM goats WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, user.orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Goat not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete goat error:', err);
    return NextResponse.json({ error: 'Failed to delete goat' }, { status: 500 });
  }
}