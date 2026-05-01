import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const breedDate = new Date(data.date_bred);
    const dueDate = new Date(breedDate);
    dueDate.setDate(dueDate.getDate() + 150);
    const estimatedKiddingDate = dueDate.toISOString().split('T')[0];
    const sireId = data.sire_id === '' ? null : data.sire_id;
    const { rows } = await pool.query(
      `INSERT INTO breeding_logs (dam_id, sire_id, date_bred, estimated_kidding_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.dam_id, sireId, data.date_bred, estimatedKiddingDate]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
