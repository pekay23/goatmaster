import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/goats/embeddings
 * Fetches all embeddings for the current user's herd.
 * Used to populate the on-device IndexedDB cache for instant re-ID.
 */
export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { rows } = await pool.query(
      `SELECT 
         ge.id,
         ge.goat_id,
         ge.embedding,
         ge.source,
         g.name,
         g.breed,
         g.sex,
         g.image_url
       FROM goat_embeddings ge
       JOIN goats g ON g.id = ge.goat_id
       WHERE g.user_id = $1`,
      [user.userId]
    );
    
    // Transform rows into a clean format for the local cache
    const embeddings = rows.map(r => ({
      id: r.id,
      goat_id: r.goat_id,
      embedding: r.embedding,
      goat: {
        id: r.goat_id,
        name: r.name,
        breed: r.breed,
        sex: r.sex,
        image_url: r.image_url
      }
    }));

    return NextResponse.json(embeddings);
  } catch (err) {
    console.error('[embeddings-sync]', err.message);
    return NextResponse.json({ error: 'Failed to fetch embeddings' }, { status: 500 });
  }
}
