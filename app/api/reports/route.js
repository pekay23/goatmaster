import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let query = '', params = [user.userId];

  if (type === 'health') {
    query = `SELECT g.name, g.sex, g.breed, g.dob, h.treatment, h.event_date, h.next_due_date
             FROM health_logs h JOIN goats g ON g.id = h.goat_id
             WHERE g.user_id = $1 ORDER BY h.event_date DESC`;
  } else if (type === 'breeding') {
    query = `SELECT d.name as doe, s.name as buck, b.date_bred, b.estimated_kidding_date
             FROM breeding_logs b
             JOIN goats d ON d.id = b.dam_id
             LEFT JOIN goats s ON s.id = b.sire_id
             WHERE d.user_id = $1 ORDER BY b.date_bred DESC`;
  } else {
    query = `SELECT breed, sex, COUNT(*) as count FROM goats
             WHERE user_id=$1 GROUP BY breed, sex ORDER BY count DESC`;
  }

  try {
    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
