import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';

export async function GET(request) {
  if (!await getAdminActor(request, 'tiers:read')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const result = await query(`
      SELECT id, name, COALESCE(price_cents, 0) as price_cents,
        COALESCE(max_goats, -1) as max_goats,
        COALESCE(max_scans_per_day, -1) as max_scans_per_day,
        COALESCE(ai_training_enabled, false) as ai_training_enabled,
        COALESCE(smart_scan_enabled, false) as smart_scan_enabled,
        paystack_plan_code_monthly,
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
  if (!await getAdminActor(request, 'tiers:write')) return NextResponse.json({ error: 'Tier management permission required' }, { status: 403 });
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid tier details' }, { status: 400 });
    const { id, max_goats, max_scans_per_day, price_cents, ai_training_enabled, smart_scan_enabled } = body;
    const paystackPlanCode = typeof body.paystack_plan_code_monthly === 'string' ? body.paystack_plan_code_monthly.trim() || null : body.paystack_plan_code_monthly;
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)
      || !Number.isSafeInteger(max_goats) || max_goats < -1
      || !Number.isSafeInteger(max_scans_per_day) || max_scans_per_day < -1
      || !Number.isSafeInteger(price_cents) || price_cents < 0 || price_cents > 100_000_000
      || typeof ai_training_enabled !== 'boolean' || typeof smart_scan_enabled !== 'boolean'
      || paystackPlanCode !== null && (typeof paystackPlanCode !== 'string' || paystackPlanCode.length > 100)) {
      return NextResponse.json({ error: 'Enter valid plan limits, price, feature settings, and monthly Paystack plan code' }, { status: 400 });
    }

    const result = await query(
      `UPDATE tiers SET
        max_goats = $1, max_scans_per_day = $2, price_cents = $3,
        ai_training_enabled = $4, smart_scan_enabled = $5, paystack_plan_code_monthly = $6
      WHERE id = $7
      RETURNING id, name, price_cents, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled, paystack_plan_code_monthly`,
      [max_goats, max_scans_per_day, price_cents, ai_training_enabled, smart_scan_enabled, paystackPlanCode, id]
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
