import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isPublicTier(tier) {
  return typeof tier.id === 'string' && tier.id.length > 0
    && typeof tier.name === 'string' && tier.name.length > 0
    && Number.isSafeInteger(tier.price_cents) && tier.price_cents >= 0
    && Number.isSafeInteger(tier.max_goats) && tier.max_goats >= -1
    && Number.isSafeInteger(tier.max_scans_per_day) && tier.max_scans_per_day >= -1
    && typeof tier.ai_training_enabled === 'boolean'
    && typeof tier.smart_scan_enabled === 'boolean';
}

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, price_cents, max_goats, max_scans_per_day, ai_training_enabled, smart_scan_enabled, paystack_plan_code_monthly FROM tiers ORDER BY price_cents ASC, id ASC'
    );
    if (!result.rows.length || !result.rows.every(isPublicTier)) {
      return NextResponse.json({ error: 'Plan pricing is temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    const tiers = result.rows.map(({ paystack_plan_code_monthly, ...tier }) => ({
      ...tier,
      checkout_available: tier.price_cents > 0 && Boolean(process.env.PAYSTACK_SECRET_KEY) && typeof paystack_plan_code_monthly === 'string' && paystack_plan_code_monthly.trim().length > 0,
    }));
    return NextResponse.json(tiers, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public plan catalogue failed:', error);
    return NextResponse.json({ error: 'Unable to load plan pricing' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
