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

    // 0. Ensure 'users' table has an 'id' column (handling legacy schema)
    const { rows: usersColumns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);

    if (usersColumns.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN id BIGSERIAL PRIMARY KEY');
      results.push('added id column to users');
    }

    // 1. Add columns to goats and create new tables
    const migrationStatements = [
      'CREATE EXTENSION IF NOT EXISTS vector',
      'ALTER TABLE goats ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE goats ADD COLUMN IF NOT EXISTS ear_tag VARCHAR(50)',
      'ALTER TABLE goats ADD COLUMN IF NOT EXISTS date_of_birth DATE',
      'ALTER TABLE goats ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT \'[]\'',
      'ALTER TABLE goats ADD COLUMN IF NOT EXISTS notes TEXT',
      `CREATE TABLE IF NOT EXISTS goat_embeddings (
        id BIGSERIAL PRIMARY KEY,
        goat_id BIGINT REFERENCES goats(id) ON DELETE CASCADE,
        embedding vector(1024),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS goat_embeddings_ivfflat_idx 
      ON goat_embeddings USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100)`,
      `CREATE TABLE IF NOT EXISTS scan_logs (
        id BIGSERIAL PRIMARY KEY,
        matched_goat_id BIGINT REFERENCES goats(id) ON DELETE SET NULL,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        confidence FLOAT,
        scan_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      'CREATE INDEX IF NOT EXISTS idx_goats_user_id ON goats(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_embeddings_goat_id ON goat_embeddings(goat_id)'
    ];

    for (const stmt of migrationStatements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // Skip if error is "already exists" but log others
        if (!e.message.includes('already exists')) {
          console.error('[migrate-step]', e.message);
          results.push(`Error: ${e.message}`);
        }
      }
    }
    results.push('schema updated');

    // 2. Hash any remaining plaintext passwords
    const { rows: users } = await pool.query('SELECT id, password FROM users');
    let hashed = 0;
    for (const u of users) {
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
