import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isPositiveInt } from '@/lib/validate';

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { goatId, embedding, source = 'enrollment' } = await request.json();
    if (!isPositiveInt(goatId) || !embedding?.length) {
      return NextResponse.json({ error: 'goatId and embedding required' }, { status: 400 });
    }
    // Ensure goat belongs to user
    const { rows: check } = await pool.query(
      'SELECT id FROM goats WHERE id=$1 AND user_id=$2', [goatId, user.userId]
    );
    if (!check.length) return NextResponse.json({ error: 'Goat not found' }, { status: 404 });

    const { rows } = await pool.query(
      `INSERT INTO goat_embeddings (goat_id, embedding, source) VALUES ($1,$2,$3) RETURNING id`,
      [goatId, embedding, source]
    );
    return NextResponse.json({ ok: true, embeddingId: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const goatId = parseInt(searchParams.get('goatId'), 10);
    if (!isPositiveInt(goatId)) return NextResponse.json({ error: 'goatId required' }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM goat_embeddings ge
       JOIN goats g ON g.id = ge.goat_id
       WHERE ge.goat_id=$1 AND g.user_id=$2`,
      [goatId, user.userId]
    );
    return NextResponse.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
