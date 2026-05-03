import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];

    const run = async (label, sql, params = []) => {
      try {
        await pool.query(sql, params);
        results.push(`✓ ${label}`);
      } catch (e) {
        results.push(`⚠ ${label}: ${e.message}`);
      }
    };

    // ── 1. Ensure users table has an id column ────────────────────
    const { rows: hasId } = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='users' AND column_name='id'
    `);
    if (hasId.length === 0) {
      await run('users: add id (bigserial)', `ALTER TABLE users ADD COLUMN id BIGSERIAL`);
      // Only add PK if there isn't one already
      const { rows: hasPk } = await pool.query(`
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='users' AND constraint_type='PRIMARY KEY'
      `);
      if (hasPk.length === 0) {
        await run('users: set primary key', `ALTER TABLE users ADD PRIMARY KEY (id)`);
      } else {
        results.push('✓ users: primary key already exists — skipped');
      }
    } else {
      results.push('✓ users.id already exists — skipped');
    }

    // ── 2. Try pgvector extension (needs superuser or rds_superuser) ──
    await run('extension: pgvector', `CREATE EXTENSION IF NOT EXISTS vector`);

    // ── 3. goats columns ──────────────────────────────────────────
    await run('goats.user_id', `ALTER TABLE goats ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`);
    await run('goats.ear_tag', `ALTER TABLE goats ADD COLUMN IF NOT EXISTS ear_tag VARCHAR(50)`);
    await run('goats.qr_code', `ALTER TABLE goats ADD COLUMN IF NOT EXISTS qr_code VARCHAR(200)`);
    await run('goats.notes',   `ALTER TABLE goats ADD COLUMN IF NOT EXISTS notes TEXT`);

    // ── 4. goat_embeddings ────────────────────────────────────────
    // Try with pgvector type first, fall back to float8[] if extension unavailable
    const { rows: hasVector } = await pool.query(`
      SELECT 1 FROM pg_extension WHERE extname='vector'
    `);

    if (hasVector.length > 0) {
      await run('create goat_embeddings (vector)', `
        CREATE TABLE IF NOT EXISTS goat_embeddings (
          id         BIGSERIAL PRIMARY KEY,
          goat_id    BIGINT NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
          embedding  vector(1024),
          source     VARCHAR(50) DEFAULT 'enrollment',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await run('idx goat_embeddings ivfflat', `
        CREATE INDEX IF NOT EXISTS goat_embeddings_ivfflat_idx
        ON goat_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
    } else {
      // pgvector not available — use float8 array (fallback, cosine done in JS)
      await run('create goat_embeddings (float8[] fallback)', `
        CREATE TABLE IF NOT EXISTS goat_embeddings (
          id         BIGSERIAL PRIMARY KEY,
          goat_id    BIGINT NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
          embedding  FLOAT8[] NOT NULL,
          source     VARCHAR(50) DEFAULT 'enrollment',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      results.push('⚠ pgvector unavailable — using float8[] (cosine done in-app). Enable pgvector in DB for best performance.');
    }

    // ── 5. scan_logs ──────────────────────────────────────────────
    await run('create scan_logs', `
      CREATE TABLE IF NOT EXISTS scan_logs (
        id              BIGSERIAL PRIMARY KEY,
        matched_goat_id BIGINT REFERENCES goats(id) ON DELETE SET NULL,
        confidence      FLOAT4,
        breed_guess     VARCHAR(100),
        scan_method     VARCHAR(20),
        image_url       VARCHAR(500),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await run('scan_logs.user_id', `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`);

    // ── 6. Indexes ────────────────────────────────────────────────
    await run('idx goats.user_id',      `CREATE INDEX IF NOT EXISTS idx_goats_user_id ON goats(user_id)`);
    await run('idx embeddings.goat_id', `CREATE INDEX IF NOT EXISTS idx_embeddings_goat_id ON goat_embeddings(goat_id)`);
    await run('idx scan_logs.user_id',  `CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id)`);

    // ── 7. Health & Breeding Logs ─────────────────────────────────
    await run('create health_logs', `
      CREATE TABLE IF NOT EXISTS health_logs (
        id            BIGSERIAL PRIMARY KEY,
        goat_id       BIGINT NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        event_date    DATE NOT NULL,
        treatment     VARCHAR(200) NOT NULL,
        notes         TEXT,
        next_due_date DATE,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await run('create breeding_logs', `
      CREATE TABLE IF NOT EXISTS breeding_logs (
        id                     BIGSERIAL PRIMARY KEY,
        dam_id                 BIGINT NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        sire_id                BIGINT REFERENCES goats(id) ON DELETE SET NULL,
        date_bred              DATE NOT NULL,
        estimated_kidding_date DATE,
        actual_kidding_date    DATE,
        notes                  TEXT,
        created_at             TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await run('idx health.goat_id',   `CREATE INDEX IF NOT EXISTS idx_health_logs_goat_id ON health_logs(goat_id)`);
    await run('idx breeding.dam_id',  `CREATE INDEX IF NOT EXISTS idx_breeding_logs_dam_id ON breeding_logs(dam_id)`);

    // ── 7a. ID corrections log (feedback loop for re-training) ──
    await run('create id_corrections', `
      CREATE TABLE IF NOT EXISTS id_corrections (
        id              BIGSERIAL PRIMARY KEY,
        user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
        correction_type VARCHAR(20) NOT NULL,
        source_goat_id  BIGINT REFERENCES goats(id) ON DELETE SET NULL,
        target_goat_id  BIGINT REFERENCES goats(id) ON DELETE SET NULL,
        embedding       FLOAT8[],
        notes           TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await run('idx corrections.user_id', `CREATE INDEX IF NOT EXISTS idx_corrections_user_id ON id_corrections(user_id)`);

    // ── 7. Hash any plaintext passwords ──────────────────────────
    const { rows: users } = await pool.query('SELECT id, password FROM users');
    let hashed = 0;
    for (const u of users) {
      if (u.password && !u.password.startsWith('$2')) {
        const hash = await bcrypt.hash(u.password, 12);
        await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, u.id]);
        hashed++;
      }
    }
    results.push(`✓ ${hashed} password(s) hashed`);

    // ── 7.5 Normalize usernames to lowercase ─────────────────────
    const { rowCount: updatedUsernames } = await pool.query('UPDATE users SET username = LOWER(username) WHERE username != LOWER(username)');
    results.push(`✓ ${updatedUsernames} username(s) normalized to lowercase`);

    // ── 8. Assign orphaned goats to first user ───────────────────
    const { rows: firstUser } = await pool.query('SELECT id FROM users ORDER BY id LIMIT 1');
    if (firstUser.length > 0) {
      const { rowCount } = await pool.query(
        'UPDATE goats SET user_id=$1 WHERE user_id IS NULL', [firstUser[0].id]
      );
      results.push(`✓ ${rowCount} goat(s) assigned to user id=${firstUser[0].id}`);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
