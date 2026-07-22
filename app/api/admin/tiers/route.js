import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT id, name, COALESCE(price_cents, 0) as price_cents,
        COALESCE(max_goats, -1) as max_goats,
        COALESCE(max_scans_per_day, -1) as max_scans_per_day,
        COALESCE(ai_training_enabled, false) as ai_training_enabled,
        COALESCE(smart_scan_enabled, false) as smart_scan_enabled,
        (SELECT COUNT(*) FROM users WHERE COALESCE(tier, 'free') = tiers.id) as user_count
      FROM tiers
      ORDER BY price_cents ASC
    `);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Admin tiers error:', err);
    return NextResponse.json({ error: 'Failed to load tiers' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, max_goats, max_scans_per_day, price_cents, ai_training_enabled, smart_scan_enabled } = body;

    const result = await query(
      `UPDATE tiers SET
        max_goats = $1, max_scans_per_day = $2, price_cents = $3,
        ai_training_enabled = $4, smart_scan_enabled = $5
      WHERE id = $6
      RETURNING id, name, price_cents, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled`,
      [max_goats, max_scans_per_day, price_cents, ai_training_enabled, smart_scan_enabled, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Admin update tier error:', err);
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
  }
}