import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { sanitiseString } from '@/lib/validate';

/**
 * POST /api/goats/bulk
 * Body: { newGoats: [{ name, breed, sex, image_url, notes, embeddings: [[]] }] }
 *
 * Creates multiple goats in one transaction and stores their embeddings.
 * Used by the Smart Scan auto-discovery flow.
 */
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const client = await pool.connect();
  try {
    const body = await request.json();
    const newGoats = Array.isArray(body.newGoats) ? body.newGoats : [];
    if (newGoats.length === 0) {
      return NextResponse.json({ error: 'No goats provided' }, { status: 400 });
    }
    if (newGoats.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 goats per bulk request' }, { status: 400 });
    }

    await client.query('BEGIN');

    const created = [];

    // Detect whether we're using pgvector or float8[]
    const { rows: hasVector } = await client.query(
      `SELECT 1 FROM pg_extension WHERE extname='vector'`
    );
    const useVector = hasVector.length > 0;

    for (const g of newGoats) {
      const name  = sanitiseString(g.name, 100);
      const breed = sanitiseString(g.breed, 100) || null;
      const sex   = ['F','M','W'].includes(g.sex) ? g.sex : 'F';
      const url   = sanitiseString(g.image_url, 500) || null;
      const notes = sanitiseString(g.notes, 1000) || null;

      if (!name) continue;

      // Insert goat
      const { rows } = await client.query(
        `INSERT INTO goats (name, sex, breed, image_url, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, sex, breed, url, notes, user.userId]
      );
      const goat = rows[0];

      // Insert all embeddings for this goat
      if (Array.isArray(g.embeddings)) {
        for (const emb of g.embeddings) {
          if (!Array.isArray(emb) || emb.length === 0) continue;
          const value = useVector ? `[${emb.join(',')}]` : emb;
          await client.query(
            `INSERT INTO goat_embeddings (goat_id, embedding, source) VALUES ($1, $2, 'auto-discovery')`,
            [goat.id, value]
          );
        }
      }

      created.push({ goat, embeddingCount: g.embeddings?.length || 0 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, created, count: created.length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[bulk-create]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
