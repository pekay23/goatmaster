import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get MRR breakdown by tier
    const mrrResult = await query(`
      SELECT 
        o.tier,
        COUNT(*) as org_count,
        SUM(t.price_cents) as mrr_cents
      FROM organizations o
      JOIN tiers t ON t.id = o.tier
      WHERE o.subscription_status = 'active' AND o.tier != 'free'
      GROUP BY o.tier
      ORDER BY mrr_cents DESC
    `);

    // Get total MRR
    const totalMrrResult = await query(`
      SELECT 
        SUM(t.price_cents) as total_mrr_cents,
        COUNT(*) as active_subs
      FROM organizations o
      JOIN tiers t ON t.id = o.tier
      WHERE o.subscription_status = 'active' AND o.tier != 'free'
    `);

    // Get ARR (annual)
    const arrResult = await query(`
      SELECT 
        SUM(t.price_cents) * 12 as arr_cents
      FROM organizations o
      JOIN tiers t ON t.id = o.tier
      WHERE o.subscription_status = 'active' AND o.tier != 'free'
    `);

    // Get failed payments last 7 days
    const failedPaymentsResult = await query(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '7 days'
    `);

    // Get signup trend (last 30 days)
    const signupTrendResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE tier != 'free') as paid_count
      FROM organizations
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get revenue by month (last 12 months)
    const monthlyRevenueResult = await query(`
      SELECT 
        DATE_TRUNC('month', p.created_at) as month,
        SUM(p.amount) as revenue_cents
      FROM payments p
      WHERE p.status = 'success' AND p.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', p.created_at)
      ORDER BY month ASC
    `);

    // Get cohort analysis - organizations by signup month and their retention
    const cohortResult = await query(`
      SELECT 
        DATE_TRUNC('month', o.created_at) as cohort_month,
        COUNT(*) as total_orgs,
        COUNT(*) FILTER (WHERE o.subscription_status = 'active') as active_orgs,
        COUNT(*) FILTER (WHERE o.tier != 'free') as paid_orgs
      FROM organizations o
      WHERE o.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY cohort_month ASC
    `);

    // Get tier distribution
    const tierDistResult = await query(`
      SELECT 
        tier,
        COUNT(*) as count
      FROM organizations
      GROUP BY tier
      ORDER BY count DESC
    `);

    return NextResponse.json({
      mrr: {
        total: parseInt(totalMrrResult.rows[0]?.total_mrr_cents || '0'),
        activeSubs: parseInt(totalMrrResult.rows[0]?.active_subs || '0'),
        byTier: mrrResult.rows.map((r: any) => ({
          tier: r.tier,
          orgCount: parseInt(r.org_count),
          mrrCents: parseInt(r.mrr_cents || '0'),
        })),
      },
      arr: {
        total: parseInt(arrResult.rows[0]?.arr_cents || '0'),
      },
      failedPayments7d: parseInt(failedPaymentsResult.rows[0]?.count || '0'),
      signupTrend: signupTrendResult.rows.map((r: any) => ({
        date: r.date,
        total: parseInt(r.count),
        paid: parseInt(r.paid_count || '0'),
      })),
      monthlyRevenue: monthlyRevenueResult.rows.map((r: any) => ({
        month: r.month,
        revenueCents: parseInt(r.revenue_cents || '0'),
      })),
      cohorts: cohortResult.rows.map((r: any) => ({
        cohortMonth: r.cohort_month,
        totalOrgs: parseInt(r.total_orgs),
        activeOrgs: parseInt(r.active_orgs),
        paidOrgs: parseInt(r.paid_orgs),
        retentionRate: r.total_orgs > 0 ? (parseInt(r.active_orgs) / parseInt(r.total_orgs)) * 100 : 0,
      })),
      tierDistribution: tierDistResult.rows.map((r: any) => ({
        tier: r.tier,
        count: parseInt(r.count),
      })),
    });
  } catch (err) {
    console.error('Admin revenue analytics error:', err);
    return NextResponse.json({ error: 'Failed to load revenue analytics' }, { status: 500 });
  }
}