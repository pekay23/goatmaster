import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { embedding, image, earTag, qrCode } = await request.json();

    // 1. Primary Signal: QR or Ear Tag (100% confidence)
    if (qrCode || earTag) {
      const col = qrCode ? 'qr_code' : 'ear_tag';
      const val = qrCode || earTag;
      const { rows } = await pool.query(
        `SELECT * FROM goats WHERE ${col}=$1 AND user_id=$2 LIMIT 1`,
        [val, user.userId]
      );
      if (rows.length > 0) {
        return NextResponse.json({ goat: rows[0], confidence: 1.0, method: col });
      }
    }

    // 2. High-Accuracy Signal: Server-side ML Microservice (YOLOv8 + ResNet)
    if (image && process.env.ML_SERVICE_URL) {
      try {
        const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/scan`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-ML-Key': process.env.ML_SERVICE_KEY
          },
          body: JSON.stringify({ image_b64: image, user_id: user.userId })
        });
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          return NextResponse.json(mlData);
        }
      } catch (mlErr) {
        console.warn('[scan-proxy] ML service unreachable, falling back to basic vector search', mlErr.message);
      }
    }

    // 3. Fallback/Secondary Signal: Visual Embedding (pgvector similarity)
    if (embedding?.length) {
      const vectorStr = `[${embedding.join(',')}]`;
      const { rows } = await pool.query(
        `SELECT 
           g.*, 
           1 - (ge.embedding <=> $1::vector) as similarity
         FROM goat_embeddings ge 
         JOIN goats g ON g.id = ge.goat_id
         WHERE g.user_id = $2
         ORDER BY ge.embedding <=> $1::vector
         LIMIT 1`,
        [vectorStr, user.userId]
      );

      if (rows.length > 0) {
        const best = rows[0];
        const score = parseFloat(best.similarity);
        const threshold = 0.75;
        const lowConfidence = score < threshold;

        await pool.query(
          `INSERT INTO scan_logs (matched_goat_id, user_id, confidence, scan_method)
           VALUES ($1,$2,$3,'face')`,
          [best.id, user.userId, score]
        );

        return NextResponse.json({ 
          goat: best, 
          confidence: score, 
          method: 'face',
          lowConfidence 
        });
      }
    }

    return NextResponse.json({ goat: null, confidence: 0, method: null });
  } catch (err) {
    console.error('[scan]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
