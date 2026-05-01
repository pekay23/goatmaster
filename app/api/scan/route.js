import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Cosine similarity between two float arrays
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * POST /api/scan
 * Body: { embedding: number[], earTag?: string, qrCode?: string }
 *
 * Returns the best matching goat profile + confidence score.
 * The embedding is produced on-device by TF.js (MobileNet feature vector).
 * If earTag or qrCode is provided they are used as a high-confidence shortcut.
 */
export async function POST(request) {
  try {
    const { embedding, earTag, qrCode } = await request.json();

    // --- Priority 1: QR / ear tag exact match ---
    if (qrCode || earTag) {
      const col = qrCode ? 'qr_code' : 'ear_tag';
      const val = qrCode || earTag;
      const { rows } = await pool.query(
        `SELECT * FROM goats WHERE ${col} = $1 LIMIT 1`, [val]
      );
      if (rows.length > 0) {
        return NextResponse.json({ goat: rows[0], confidence: 1.0, method: col });
      }
    }

    // --- Priority 2: Embedding cosine similarity ---
    if (embedding && embedding.length > 0) {
      const { rows: embRows } = await pool.query(`
        SELECT ge.goat_id, ge.embedding, g.*
        FROM goat_embeddings ge
        JOIN goats g ON g.id = ge.goat_id
      `);

      let best = null, bestScore = 0;
      for (const row of embRows) {
        const score = cosine(embedding, row.embedding);
        if (score > bestScore) { bestScore = score; best = row; }
      }

      // Threshold: ≥ 0.72 = confident match
      if (best && bestScore >= 0.72) {
        // Log the scan
        await pool.query(
          `INSERT INTO scan_logs (matched_goat_id, confidence, scan_method) VALUES ($1, $2, 'face')`,
          [best.goat_id, bestScore]
        );
        // Return goat without embedding blob
        const { embedding: _, ...goat } = best;
        return NextResponse.json({ goat, confidence: bestScore, method: 'face' });
      }

      // Low confidence — return best guess with flag
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
