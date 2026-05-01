import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/db-migrate  — run once to add scan/embedding tables
// Protect with a secret: POST { secret: process.env.MIGRATE_SECRET }
export async function POST(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query(`
      -- Add ear_tag and qr_code to goats
      ALTER TABLE goats
        ADD COLUMN IF NOT EXISTS ear_tag   VARCHAR(50),
        ADD COLUMN IF NOT EXISTS qr_code   VARCHAR(200);

      -- Embedding vectors for visual re-ID (128-dim placeholder, upgrade to 512 with real model)
      CREATE TABLE IF NOT EXISTS goat_embeddings (
        id            SERIAL PRIMARY KEY,
        goat_id       INTEGER NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        embedding     FLOAT8[] NOT NULL,
        source        VARCHAR(20) DEFAULT 'enrollment', -- enrollment | scan
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      -- Scan history log
      CREATE TABLE IF NOT EXISTS scan_logs (
        id              SERIAL PRIMARY KEY,
        matched_goat_id INTEGER REFERENCES goats(id) ON DELETE SET NULL,
        confidence      FLOAT4,
        breed_guess     VARCHAR(100),
        scan_method     VARCHAR(20), -- face | ear_tag | qr
        image_url       VARCHAR(500),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      -- Index for fast embedding lookup
      CREATE INDEX IF NOT EXISTS idx_embeddings_goat_id ON goat_embeddings(goat_id);
    `);

    return NextResponse.json({ ok: true, message: 'Schema migration complete' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
