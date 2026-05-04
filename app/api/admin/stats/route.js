import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const [users, goats, scans, embeddings, byTier, signups] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM users'),
      pool.query('SELECT COUNT(*)::int as count FROM goats'),
      pool.query('SELECT COUNT(*)::int as count FROM scan_logs'),
      pool.query('SELECT COUNT(*)::int as count FROM goat_embeddings'),
      pool.query(`
        SELECT COALESCE(subscription_tier, 'free') as tier, COUNT(*)::int as count
        FROM users GROUP BY subscription_tier ORDER BY count DESC
      `),
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM users
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date
      `),
    ]);

    return NextResponse.json({
      totalUsers: users.rows[0].count,
      totalGoats: goats.rows[0].count,
      totalScans: scans.rows[0].count,
      totalEmbeddings: embeddings.rows[0].count,
      usersByTier: byTier.rows,
      signupsLast30d: signups.rows,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
