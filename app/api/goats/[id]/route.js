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

    const { rows } = await pool.query(
      `UPDATE goats SET name=$1,breed=$2,sex=$3,dob=$4,image_url=$5,ear_tag=$6,qr_code=$7
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [name, breed, sex, dob, imageUrl, earTag, qrCode, id, user.userId]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const id = parseInt(params.id, 10);
  if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  if (!await ownsGoat(user.userId, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await pool.query('DELETE FROM health_logs    WHERE goat_id = $1', [id]);
    await pool.query('DELETE FROM breeding_logs  WHERE dam_id=$1 OR sire_id=$1', [id]);
    await pool.query('DELETE FROM goat_embeddings WHERE goat_id = $1', [id]);
    await pool.query('DELETE FROM goats          WHERE id=$1 AND user_id=$2', [id, user.userId]);
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
