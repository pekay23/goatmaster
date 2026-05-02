import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireFields, sanitiseString, sanitiseDate, isPositiveInt } from '@/lib/validate';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { rows } = await pool.query(
      `SELECT h.* FROM health_logs h
       JOIN goats g ON g.id = h.goat_id
       WHERE g.user_id = $1 ORDER BY h.event_date DESC`,
      [user.userId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const body = await request.json();
    const fieldErr = requireFields(body, ['goat_id', 'event_date', 'treatment']);
    if (fieldErr) return NextResponse.json({ error: fieldErr }, { status: 400 });

    const goatId = parseInt(body.goat_id, 10);
    if (!isPositiveInt(goatId)) return NextResponse.json({ error: 'Invalid goat_id' }, { status: 400 });

    // Verify goat belongs to this user
    const { rows: check } = await pool.query(
      'SELECT id FROM goats WHERE id=$1 AND user_id=$2', [goatId, user.userId]
    );
    if (!check.length) return NextResponse.json({ error: 'Goat not found' }, { status: 404 });

    const { rows } = await pool.query(
      `INSERT INTO health_logs (goat_id, event_date, treatment, notes, next_due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [goatId, sanitiseDate(body.event_date), sanitiseString(body.treatment, 200),
       sanitiseString(body.notes, 1000), sanitiseDate(body.next_due_date)]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
