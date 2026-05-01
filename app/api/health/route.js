import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const nextDue = data.next_due_date === '' ? null : data.next_due_date;
    const { rows } = await pool.query(
      `INSERT INTO health_logs (goat_id, event_date, treatment, notes, next_due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.goat_id, data.event_date, data.treatment, data.notes, nextDue]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
