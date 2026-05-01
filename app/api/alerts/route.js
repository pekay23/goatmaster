import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { rows } = await pool.query(`
      SELECT h.id, g.name, h.treatment, h.next_due_date
      FROM health_logs h
      JOIN goats g ON h.goat_id = g.id
      WHERE g.user_id = $1
        AND h.next_due_date IS NOT NULL
        AND h.next_due_date <= (CURRENT_DATE + INTERVAL '7 days')
      ORDER BY h.next_due_date ASC`,
      [user.userId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
