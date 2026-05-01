import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { embedding, earTag, qrCode } = await request.json();

    if (qrCode || earTag) {
      const col = qrCode ? 'qr_code' : 'ear_tag';
      const val = qrCode || earTag;
      const { rows } = await pool.query(
        `SELECT * FROM goats WHERE ${col}=$1 AND user_id=$2 LIMIT 1`,
        [val, user.userId]
      );
      if (rows.length > 0) return NextResponse.json({ goat: rows[0], confidence: 1.0, method: col });
    }

    if (embedding?.length) {
      const { rows: embRows } = await pool.query(
        `SELECT ge.goat_id, ge.embedding, g.*
         FROM goat_embeddings ge JOIN goats g ON g.id = ge.goat_id
         WHERE g.user_id = $1`,
        [user.userId]
      );

      let best = null, bestScore = 0;
      for (const row of embRows) {
        const score = cosine(embedding, row.embedding);
        if (score > bestScore) { bestScore = score; best = row; }
      }

      if (best && bestScore >= 0.72) {
        await pool.query(
          `INSERT INTO scan_logs (matched_goat_id, user_id, confidence, scan_method)
           VALUES ($1,$2,$3,'face')`,
          [best.goat_id, user.userId, bestScore]
        );
        const { embedding: _, ...goat } = best;
        return NextResponse.json({ goat, confidence: bestScore, method: 'face' });
      }
      if (best) {
        const { embedding: _, ...goat } = best;
        return NextResponse.json({ goat, confidence: bestScore, method: 'face', lowConfidence: true });
      }
    }

    return NextResponse.json({ goat: null, confidence: 0, method: null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
