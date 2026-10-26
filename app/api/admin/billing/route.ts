import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor, pagination } from '@/app/api/admin/access';
export async function GET(request: Request) {
  if (!await getAdminActor(request, 'billing:read')) return NextResponse.json({ error: 'Billing access required' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = pagination(searchParams, 25);
    const search = (searchParams.get('search') || '').trim().slice(0,200);
    const tier = searchParams.get('tier') || '';
    const status = searchParams.get('status') || '';
    const values = [search,'%' + search + '%',tier,status,searchParams.get('include_demo') === 'true'];
    const owner = " LEFT JOIN LATERAL (SELECT u.email FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = o.id AND m.role = 'owner' AND m.status = 'active' ORDER BY u.created_at LIMIT 1) owner ON true ";
    const where = " WHERE ($1 = '' OR o.name ILIKE $2 OR o.slug ILIKE $2 OR owner.email ILIKE $2) AND ($3 = '' OR o.tier = $3) AND ($4 = '' OR o.subscription_status = $4) AND ($5 OR NOT o.is_demo) ";
    const [count,result] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM organizations o ' + owner + where, values),
      query('SELECT o.id,o.name,o.slug,o.tier,o.subscription_status,o.paystack_customer_code,o.paystack_subscription_code,o.current_period_end,o.cancel_at_period_end,o.manual_override,o.override_reason,owner.email AS owner_email,t.price_cents AS tier_price_cents FROM organizations o ' + owner + ' LEFT JOIN tiers t ON t.id = o.tier ' + where + ' ORDER BY o.created_at DESC,o.id LIMIT $6 OFFSET $7', [...values,limit,offset]),
    ]);
    const total = count.rows[0].count;
    return NextResponse.json({ subscriptions: result.rows,total,totalPages: Math.ceil(total/limit),page,limit });
  } catch(error) { console.error('Billing directory failed:',error); return NextResponse.json({error:'Unable to load billing records'},{status:500}); }
}
