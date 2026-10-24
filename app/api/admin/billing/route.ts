import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25'), 1), 100);
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    const conditions: string[] = [];
    if (search) {
      conditions.push(`(o.name ILIKE $${params.length + 1} OR o.slug ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    if (tier) {
      conditions.push(`o.tier = $${params.length + 1}`);
      params.push(tier);
    }
    if (status) {
      conditions.push(`o.subscription_status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM organizations o LEFT JOIN users u ON u.organization_id = o.id ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const paramsWithPagination = [...params, limit, offset];
    const result = await query(
      `SELECT 
        o.id, o.name, o.slug, o.tier, o.subscription_status,
        o.paystack_customer_code, o.paystack_subscription_code,
        o.current_period_end, o.cancel_at_period_end,
        o.manual_override, o.override_reason,
        u.email as owner_email,
        (SELECT price_cents FROM tiers t WHERE t.id = o.tier) as tier_price_cents
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id AND u.role IN ('owner', 'admin')
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      paramsWithPagination
    );

    return NextResponse.json({
      subscriptions: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error('Admin billing error:', err);
    return NextResponse.json({ error: 'Failed to load billing data' }, { status: 500 });
  }
}