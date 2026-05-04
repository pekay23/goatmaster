import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;

    const whereClause = search
      ? `WHERE u.username ILIKE $1`
      : '';
    const params = search ? [`%${search}%`] : [];

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM users u ${whereClause}`,
      params
    );
    const total = countRes.rows[0].total;

    const usersRes = await pool.query(
      `SELECT u.id, u.username, u.role, u.subscription_tier, u.is_active, u.created_at,
              COUNT(DISTINCT g.id)::int as goat_count,
              COUNT(DISTINCT s.id)::int as scan_count
       FROM users u
       LEFT JOIN goats g ON g.user_id = u.id
       LEFT JOIN scan_logs s ON s.user_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      users: usersRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[admin/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
