import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // At-risk organizations: past_due, cancelled, or cancel_at_period_end
    const atRiskResult = await query(`
      SELECT 
        o.id, o.name, o.slug, o.tier, o.subscription_status,
        o.current_period_end, o.cancel_at_period_end,
        o.paystack_customer_code, o.paystack_subscription_code,
        u.email as owner_email,
        t.price_cents as tier_price_cents,
        CASE 
          WHEN o.subscription_status = 'past_due' THEN 'past_due'
          WHEN o.cancel_at_period_end THEN 'cancelling'
          WHEN o.subscription_status = 'cancelled' THEN 'cancelled'
          ELSE 'at_risk'
        END as risk_level,
        CASE 
          WHEN o.current_period_end IS NOT NULL THEN 
            EXTRACT(DAY FROM (o.current_period_end - NOW()))::int
          ELSE NULL
        END as days_until_renewal,
        COALESCE((
          SELECT SUM(ul.count) 
          FROM usage_logs ul 
          WHERE ul.organization_id = o.id 
          AND ul.feature = 'scan' 
          AND ul.period_start >= NOW() - INTERVAL '7 days'
        ), 0) as scans_7d
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id AND u.role IN ('owner', 'admin')
      LEFT JOIN tiers t ON t.id = o.tier
      WHERE o.subscription_status IN ('past_due', 'cancelled') 
         OR o.cancel_at_period_end = true
      ORDER BY o.current_period_end ASC NULLS LAST
    `);

    // Get retention offers sent
    const offersResult = await query(`
      SELECT ro.*, o.name as org_name
      FROM retention_offers ro
      JOIN organizations o ON o.id = ro.organization_id
      WHERE ro.status IN ('sent', 'accepted')
      ORDER BY ro.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({
      atRiskOrgs: atRiskResult.rows,
      retentionOffers: offersResult.rows,
    });
  } catch (err) {
    console.error('Churn recovery error:', err);
    return NextResponse.json({ error: 'Failed to load churn data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { organizationId, offerType, discount, expiryDays, notes } = await request.json();
    
    if (!organizationId || !offerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const org = await query('SELECT id, name, tier FROM organizations WHERE id = $1', [organizationId]);
    if (org.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 7));

    const result = await query(
      `INSERT INTO retention_offers (organization_id, offer_type, discount, expires_at, status, notes, created_by)
       VALUES ($1, $2, $3, $4, 'sent', $5, $6)
       RETURNING *`,
      [organizationId, offerType, discount || 0, expiryDate, notes || null, user.sub]
    );

    // Send email (placeholder - integrate with email service)
    // await sendRetentionEmail(org.rows[0].email, offerType, discount, expiryDate);

    return NextResponse.json({ offer: result.rows[0] });
  } catch (err) {
    console.error('Create retention offer error:', err);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}