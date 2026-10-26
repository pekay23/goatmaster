import { NextResponse } from 'next/server';
import { getClient, query } from '@/lib/db';
import { getAdminActor, isUuid } from '@/app/api/admin/access';
export async function GET(request: Request) {
  if (!await getAdminActor(request,'billing:read')) return NextResponse.json({error:'Billing access required'},{status:403});
  const includeDemo = new URL(request.url).searchParams.get('include_demo') === 'true';
  try {
    const [atRisk,offers] = await Promise.all([
      query("SELECT o.id,o.name,o.slug,o.tier,o.subscription_status,o.current_period_end,o.cancel_at_period_end,owner.email AS owner_email,t.price_cents AS tier_price_cents,CASE WHEN o.subscription_status = 'past_due' THEN 'past_due' WHEN o.cancel_at_period_end THEN 'cancelling' ELSE 'cancelled' END AS risk_level, CASE WHEN o.current_period_end IS NOT NULL THEN EXTRACT(DAY FROM (o.current_period_end - NOW()))::int ELSE NULL END AS days_until_renewal,(SELECT COUNT(*)::int FROM scan_history s WHERE s.organization_id = o.id AND s.created_at >= NOW() - INTERVAL '7 days') AS scans_7d FROM organizations o LEFT JOIN LATERAL (SELECT u.email FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = o.id AND m.role = 'owner' AND m.status = 'active' ORDER BY u.created_at LIMIT 1) owner ON true LEFT JOIN tiers t ON t.id = o.tier WHERE (o.subscription_status IN ('past_due','cancelled') OR o.cancel_at_period_end = true) AND ($1 OR NOT o.is_demo) ORDER BY o.current_period_end ASC NULLS LAST LIMIT 100", [includeDemo]),
      query('SELECT ro.*,o.name AS org_name FROM retention_offers ro JOIN organizations o ON o.id = ro.organization_id WHERE $1 OR NOT o.is_demo ORDER BY ro.created_at DESC LIMIT 50', [includeDemo]),
    ]);
    return NextResponse.json({atRiskOrgs:atRisk.rows,retentionOffers:offers.rows});
  } catch(error) {console.error('Account recovery failed:',error);return NextResponse.json({error:'Unable to load recovery records'},{status:500});}
}
export async function POST(request: Request) {
  const actor = await getAdminActor(request,'billing:write');
  if (!actor) return NextResponse.json({error:'Billing write access required'},{status:403});
  const body = await request.json();
  const { organizationId,offerType,discount,expiryDays,notes } = body;
  if (!isUuid(organizationId) || !['discount','payment_reminder','extension'].includes(offerType) || !Number.isInteger(discount) || discount < 0 || discount > 50 || !Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 30 || typeof notes !== 'string' || notes.trim().length < 5 || notes.length > 1000) return NextResponse.json({error:'Provide an organization, offer type, discount from 0 to 50, expiry from 1 to 30 days, and a reason'},{status:400});
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const org = await client.query('SELECT id FROM organizations WHERE id = $1 FOR KEY SHARE',[organizationId]);
    if (!org.rowCount) {await client.query('ROLLBACK');return NextResponse.json({error:'Organization not found'},{status:404});}
    const result = await client.query("INSERT INTO retention_offers (organization_id,offer_type,discount,expires_at,status,notes,created_by) VALUES ($1,$2,$3,NOW() + $4::int * INTERVAL '1 day','draft',$5,$6) RETURNING *",[organizationId,offerType,discount,expiryDays,notes.trim(),actor.sub]);
    await client.query("INSERT INTO audit_logs (actor_id,actor_email,actor_role,action,resource,resource_id,organization_id,after_state) VALUES ($1,$2,$3,'retention.draft','retention_offer',$4,$5,$6)",[actor.sub,actor.email,actor.role,result.rows[0].id,organizationId,JSON.stringify(result.rows[0])]);
    await client.query('COMMIT');
    return NextResponse.json({offer:result.rows[0],message:'Draft saved. No email has been sent and no discount has been applied.'},{status:201});
  } catch(error) {await client.query('ROLLBACK');console.error('Recovery draft failed:',error);return NextResponse.json({error:'Unable to save recovery draft'},{status:500});}
  finally {client.release();}
}
