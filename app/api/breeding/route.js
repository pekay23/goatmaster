import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireFields, sanitiseDate, isPositiveInt } from '@/lib/validate';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { rows } = await pool.query(
      `SELECT b.*, d.name as dam_name, s.name as sire_name
       FROM breeding_logs b
       JOIN goats d ON d.id = b.dam_id
       LEFT JOIN goats s ON s.id = b.sire_id
       WHERE d.user_id = $1 ORDER BY b.date_bred DESC`,
      [user.userId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const body = await request.json();
    const fieldErr = requireFields(body, ['dam_id', 'date_bred']);
    if (fieldErr) return NextResponse.json({ error: fieldErr }, { status: 400 });

    const damId  = parseInt(body.dam_id, 10);
    const sireId = body.sire_id ? parseInt(body.sire_id, 10) : null;
    if (!isPositiveInt(damId)) return NextResponse.json({ error: 'Invalid dam_id' }, { status: 400 });

    const { rows: check } = await pool.query(
      'SELECT id FROM goats WHERE id=$1 AND user_id=$2', [damId, user.userId]
    );
    if (!check.length) return NextResponse.json({ error: 'Doe not found' }, { status: 404 });

    const breedDate = new Date(body.date_bred);
    const dueDate   = new Date(breedDate);
    dueDate.setDate(dueDate.getDate() + 150);
    const estimatedKiddingDate = dueDate.toISOString().split('T')[0];

    const { rows } = await pool.query(
      `INSERT INTO breeding_logs (dam_id, sire_id, date_bred, estimated_kidding_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [damId, sireId, sanitiseDate(body.date_bred), estimatedKiddingDate]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
