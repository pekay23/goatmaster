import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [userResult, goatResult, tierResult, signupResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM goats'),
      query('SELECT COALESCE(tier, \'free\') as tier, COUNT(*) as count FROM users GROUP BY tier ORDER BY count DESC'),
      query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
    ]);
    
    // Try embedding count separately (table may not exist)
    let totalEmbeddings = 0;
    try {
      const embedResult = await query('SELECT COUNT(*) as count FROM goat_embeddings');
      totalEmbeddings = parseInt(embedResult.rows[0]?.count || 0);
    } catch {
      // goat_embeddings table doesn't exist yet — that's fine
      totalEmbeddings = 0;
    }

    return NextResponse.json({
      totalUsers: parseInt(userResult.rows[0]?.count || 0),
      totalGoats: parseInt(goatResult.rows[0]?.count || 0),
      totalScans: 0,
      totalEmbeddings,
      usersByTier: tierResult.rows.map(r => ({ tier: r.tier, count: parseInt(r.count) })),
      signupsLast30d: signupResult.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}