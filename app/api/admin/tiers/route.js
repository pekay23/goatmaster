import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await pool.query(`
      SELECT t.*,
             COUNT(u.id)::int as user_count
      FROM subscription_tiers t
      LEFT JOIN users u ON u.subscription_tier = t.id
      GROUP BY t.id
      ORDER BY t.sort_order
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[admin/tiers GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { id, name, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled, price_cents } = body;

    if (!id) return NextResponse.json({ error: 'Tier id required' }, { status: 400 });

    const { rows } = await pool.query(
      `UPDATE subscription_tiers
       SET name = COALESCE($2, name),
           max_goats = COALESCE($3, max_goats),
           max_scans_per_day = COALESCE($4, max_scans_per_day),
           ai_training_enabled = COALESCE($5, ai_training_enabled),
           smart_scan_enabled = COALESCE($6, smart_scan_enabled),
           price_cents = COALESCE($7, price_cents)
       WHERE id = $1
       RETURNING *`,
      [id, name, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled, price_cents]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[admin/tiers PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
