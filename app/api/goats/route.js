import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM goats ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const dob = data.dob === '' ? null : data.dob;
    const breed = data.breed === '' ? null : data.breed;
    const sex = data.sex || 'F';
    const { rows } = await pool.query(
      `INSERT INTO goats (name, sex, breed, dob, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, sex, breed, dob, data.image_url]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
