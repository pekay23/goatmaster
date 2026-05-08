import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isPositiveInt } from '@/lib/validate';

/**
 * POST /api/enroll/bulk
 * Body: { enrollments: [{ goatId, embeddings: [[]] }] }
 *
 * Adds new embeddings to multiple existing goats at once.
 * Used by Smart Scan when matched goats are seen from new angles.
 */
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const client = await pool.connect();
  try {
    const { enrollments } = await request.json();
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return NextResponse.json({ error: 'No enrollments provided' }, { status: 400 });
    }

    await client.query('BEGIN');

    const { rows: hasVector } = await client.query(`SELECT 1 FROM pg_extension WHERE extname='vector'`);
    const useVector = hasVector.length > 0;

    let totalAdded = 0;
    for (const e of enrollments) {
      const goatId = parseInt(e.goatId, 10);
      if (!isPositiveInt(goatId)) continue;

      // Verify ownership
      const { rows: own } = await client.query(
        'SELECT 1 FROM goats WHERE id=$1 AND user_id=$2', [goatId, user.userId]
      );
      if (!own.length) continue;

      for (const emb of (e.embeddings || [])) {
        if (!Array.isArray(emb) || emb.length === 0) continue;
        const value = useVector ? `[${emb.join(',')}]` : emb;
        await client.query(
          `INSERT INTO goat_embeddings (goat_id, embedding, source) VALUES ($1, $2, 'auto-rescan')`,
          [goatId, value]
        );
        totalAdded++;
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, added: totalAdded });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[bulk-enroll]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
