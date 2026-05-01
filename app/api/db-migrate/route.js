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

    // 1. Add user_id to goats (multi-tenancy)
    await pool.query(`
      ALTER TABLE goats ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE goats ADD COLUMN IF NOT EXISTS ear_tag  VARCHAR(50);
      ALTER TABLE goats ADD COLUMN IF NOT EXISTS qr_code  VARCHAR(200);

      CREATE TABLE IF NOT EXISTS goat_embeddings (
        id         SERIAL PRIMARY KEY,
        goat_id    INTEGER NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        embedding  FLOAT8[] NOT NULL,
        source     VARCHAR(20) DEFAULT 'enrollment',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id              SERIAL PRIMARY KEY,
        matched_goat_id INTEGER REFERENCES goats(id) ON DELETE SET NULL,
        user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        confidence      FLOAT4,
        breed_guess     VARCHAR(100),
        scan_method     VARCHAR(20),
        image_url       VARCHAR(500),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_goats_user_id      ON goats(user_id);
      CREATE INDEX IF NOT EXISTS idx_embeddings_goat_id ON goat_embeddings(goat_id);
    `);
    results.push('schema updated');

    // 2. Hash any remaining plaintext passwords
    const { rows: users } = await pool.query('SELECT id, password FROM users');
    let hashed = 0;
    for (const u of users) {
      // bcrypt hashes start with $2b$ — skip already-hashed ones
      if (!u.password.startsWith('$2')) {
        const hash = await bcrypt.hash(u.password, 12);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, u.id]);
        hashed++;
      }
    }
    results.push(`${hashed} password(s) hashed`);

    // 3. Assign existing goats to first user if user_id is null
    const { rows: firstUser } = await pool.query('SELECT id FROM users ORDER BY id LIMIT 1');
    if (firstUser.length > 0) {
      const { rowCount } = await pool.query(
        'UPDATE goats SET user_id = $1 WHERE user_id IS NULL',
        [firstUser[0].id]
      );
      results.push(`${rowCount} orphaned goat(s) assigned to user ${firstUser[0].id}`);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
