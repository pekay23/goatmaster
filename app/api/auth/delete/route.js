import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth, clearAuthCookie } from '@/lib/auth';

export async function DELETE(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const client = await pool.connect();
  try {
    // Cascade-delete all farm data owned by this user inside a transaction
    await client.query('BEGIN');
    await client.query('DELETE FROM health_logs    WHERE goat_id IN (SELECT id FROM goats WHERE user_id = $1)', [user.userId]);
    await client.query('DELETE FROM breeding_logs  WHERE dam_id  IN (SELECT id FROM goats WHERE user_id = $1) OR sire_id IN (SELECT id FROM goats WHERE user_id = $1)', [user.userId]);
    await client.query('DELETE FROM goat_embeddings WHERE goat_id IN (SELECT id FROM goats WHERE user_id = $1)', [user.userId]);
    await client.query('DELETE FROM goats WHERE user_id = $1', [user.userId]);
    await client.query('DELETE FROM users WHERE id = $1', [user.userId]);
    await client.query('COMMIT');

    const response = NextResponse.json({ message: 'Account deleted' });
    return clearAuthCookie(response);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[account-delete]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
