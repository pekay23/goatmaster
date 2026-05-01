import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/enroll  — store a new embedding for a goat
// Body: { goatId: number, embedding: number[], source?: string }
export async function POST(request) {
  try {
    const { goatId, embedding, source = 'enrollment' } = await request.json();
    if (!goatId || !embedding?.length) {
      return NextResponse.json({ error: 'goatId and embedding required' }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO goat_embeddings (goat_id, embedding, source) VALUES ($1, $2, $3) RETURNING id`,
      [goatId, embedding, source]
    );
    return NextResponse.json({ ok: true, embeddingId: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/enroll?goatId=X  — get embedding count for a goat
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const goatId = searchParams.get('goatId');
    if (!goatId) return NextResponse.json({ error: 'goatId required' }, { status: 400 });
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM goat_embeddings WHERE goat_id = $1`, [goatId]
    );
    return NextResponse.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
