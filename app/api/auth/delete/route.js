import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth, clearAuthCookie } from '@/lib/auth';

export async function DELETE(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    // Cascade-delete all farm data owned by this user
    await pool.query(`
      DELETE FROM health_logs  WHERE goat_id IN (SELECT id FROM goats WHERE user_id = $1);
      DELETE FROM breeding_logs WHERE dam_id IN (SELECT id FROM goats WHERE user_id = $1)
                                  OR sire_id IN (SELECT id FROM goats WHERE user_id = $1);
      DELETE FROM goat_embeddings WHERE goat_id IN (SELECT id FROM goats WHERE user_id = $1);
      DELETE FROM goats WHERE user_id = $1;
      DELETE FROM users WHERE id = $1;
    `, [user.userId]);

    const response = NextResponse.json({ message: 'Account deleted' });
    return clearAuthCookie(response);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
