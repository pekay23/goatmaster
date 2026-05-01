import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT h.id, g.name, h.treatment, h.next_due_date
      FROM health_logs h
      JOIN goats g ON h.goat_id = g.id
      WHERE h.next_due_date IS NOT NULL
        AND h.next_due_date <= (CURRENT_DATE + INTERVAL '7 days')
      ORDER BY h.next_due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
