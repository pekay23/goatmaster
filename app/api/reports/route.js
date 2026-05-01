import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let query = '';

  if (type === 'health') {
    query = `SELECT name, sex, breed, dob FROM goats`;
  } else if (type === 'breeding') {
    query = `SELECT name, sex, breed FROM goats WHERE sex = 'F'`;
  } else {
    query = `SELECT breed, sex, COUNT(*) as count FROM goats GROUP BY breed, sex`;
  }

  try {
    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
