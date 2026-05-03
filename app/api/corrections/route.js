import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/corrections
 * Log an identity correction — used to improve the re-ID model over time.
 *
 * Body: {
 *   correction_type: 'merge' | 'wrong_match' | 'missed_match',
 *   source_goat_id: number,      // the goat that was incorrectly identified (or duplicate)
 *   target_goat_id: number|null, // the correct goat (for wrong_match / merge)
 *   notes: string|null,
 * }
 *
 * correction_type meanings:
 *   - 'merge': Two profiles were the same goat (duplicate removed)
 *   - 'wrong_match': Scanner matched to wrong goat, user corrected it
 *   - 'missed_match': Scanner didn't recognise a known goat
 */
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { correction_type, source_goat_id, target_goat_id, notes } = body;

    if (!['merge', 'wrong_match', 'missed_match'].includes(correction_type)) {
      return NextResponse.json({ error: 'Invalid correction_type' }, { status: 400 });
    }

    if (!source_goat_id) {
      return NextResponse.json({ error: 'source_goat_id required' }, { status: 400 });
    }

    // For merges, move embeddings from source to target before deleting
    if (correction_type === 'merge' && target_goat_id) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Move all embeddings from source to target
        await client.query(
          `UPDATE goat_embeddings SET goat_id = $1, source = 'correction-merge'
           WHERE goat_id = $2`,
          [target_goat_id, source_goat_id]
        );

        // Log the correction
        await client.query(
          `INSERT INTO id_corrections (user_id, correction_type, source_goat_id, target_goat_id, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.userId, correction_type, source_goat_id, target_goat_id, notes || null]
        );

        // Delete the duplicate goat and its related records
        await client.query('DELETE FROM health_logs WHERE goat_id = $1', [source_goat_id]);
        await client.query('DELETE FROM breeding_logs WHERE dam_id=$1 OR sire_id=$1', [source_goat_id]);
        await client.query('DELETE FROM goats WHERE id=$1 AND user_id=$2', [source_goat_id, user.userId]);

        await client.query('COMMIT');
        return NextResponse.json({ ok: true, action: 'merged' });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    }

    // For non-merge corrections, just log
    await pool.query(
      `INSERT INTO id_corrections (user_id, correction_type, source_goat_id, target_goat_id, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.userId, correction_type, source_goat_id, target_goat_id || null, notes || null]
    );

    return NextResponse.json({ ok: true, action: 'logged' });
  } catch (err) {
    console.error('[corrections]', err.message);
    return NextResponse.json({ error: 'Failed to log correction' }, { status: 500 });
  }
}

/**
 * GET /api/corrections
 * Returns correction stats for the training feedback loop.
 */
export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { rows } = await pool.query(
      `SELECT correction_type, COUNT(*) as count
       FROM id_corrections WHERE user_id = $1
       GROUP BY correction_type`,
      [user.userId]
    );
    return NextResponse.json({ corrections: rows });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch corrections' }, { status: 500 });
  }
}
