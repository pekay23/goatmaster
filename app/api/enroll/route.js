import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isPositiveInt } from '@/lib/validate';

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { goat_id, embedding, images, source = 'enrollment' } = await request.json();
    const goatId = parseInt(goat_id, 10);

    // 1. Verify goat ownership
    const { rows: check } = await pool.query(
      'SELECT id FROM goats WHERE id=$1 AND user_id=$2', [goatId, user.userId]
    );
    if (!check.length) return NextResponse.json({ error: 'Goat not found' }, { status: 404 });

    let embeddingsToStore = [];

    // Case 1: Batch images from ML service
    if (images?.length && process.env.ML_SERVICE_URL) {
      const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-ML-Key': process.env.ML_SERVICE_KEY
        },
        body: JSON.stringify({ images })
      });
      if (mlRes.ok) {
        const { embeddings } = await mlRes.json();
        embeddingsToStore = embeddings;
      }
    } 
    // Case 2: Direct embedding from frontend TF.js
    else if (embedding) {
      embeddingsToStore = [embedding];
    }

    if (embeddingsToStore.length === 0) {
      return NextResponse.json({ error: 'No embeddings provided or ML service error' }, { status: 400 });
    }

    // Insert all embeddings
    for (const emb of embeddingsToStore) {
      await pool.query(
        `INSERT INTO goat_embeddings (goat_id, embedding, source) VALUES ($1,$2,$3)`,
        [goatId, `[${emb.join(',')}]`, source]
      );
    }

    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) as count FROM goat_embeddings WHERE goat_id = $1',
      [goatId]
    );

    return NextResponse.json({ ok: true, count: parseInt(countRows[0].count) });
  } catch (err) {
    console.error('[enroll]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
