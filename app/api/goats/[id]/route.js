import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const id = params.id;
    const dob = data.dob === '' ? null : data.dob;
    const { rows } = await pool.query(
      `UPDATE goats SET name=$1, breed=$2, sex=$3, dob=$4, image_url=$5 WHERE id=$6 RETURNING *`,
      [data.name, data.breed, data.sex, dob, data.image_url, id]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    await pool.query('DELETE FROM health_logs WHERE goat_id = $1', [id]);
    await pool.query('DELETE FROM breeding_logs WHERE dam_id = $1 OR sire_id = $1', [id]);
    await pool.query('DELETE FROM goats WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
