import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { sanitiseString, sanitiseDate, isPositiveInt } from '@/lib/validate';

async function ownsGoat(userId, goatId) {
  const { rows } = await pool.query(
    'SELECT id FROM goats WHERE id = $1 AND user_id = $2',
    [goatId, userId]
  );
  return rows.length > 0;
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const id = parseInt(params.id, 10);
  if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  if (!await ownsGoat(user.userId, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const body = await request.json();
    const name     = sanitiseString(body.name, 100);
    const breed    = sanitiseString(body.breed, 100) || null;
    const sex      = ['F','M','W'].includes(body.sex) ? body.sex : 'F';
    const dob      = sanitiseDate(body.dob);
    const imageUrl = sanitiseString(body.image_url, 500) || null;
    const earTag   = sanitiseString(body.ear_tag, 50) || null;
    const qrCode   = sanitiseString(body.qr_code, 200) || null;
    const notes    = sanitiseString(body.notes, 1000) || null;

    const { rows } = await pool.query(
      `UPDATE goats SET name=$1,breed=$2,sex=$3,dob=$4,image_url=$5,ear_tag=$6,qr_code=$7,notes=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, breed, sex, dob, imageUrl, earTag, qrCode, notes, id, user.userId]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[goat-update]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const id = parseInt(params.id, 10);
  if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  if (!await ownsGoat(user.userId, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM health_logs    WHERE goat_id = $1', [id]);
    await client.query('DELETE FROM breeding_logs  WHERE dam_id=$1 OR sire_id=$1', [id]);
    await client.query('DELETE FROM goat_embeddings WHERE goat_id = $1', [id]);
    await client.query('DELETE FROM goats          WHERE id=$1 AND user_id=$2', [id, user.userId]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[goat-delete]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
