import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getAdminActor, isUuid } from '@/app/api/admin/access';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor(request, 'billing:write');
  if (!actor) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
  const body: unknown = await request.json();
  if (typeof body !== 'object' || body === null || !('tier' in body) || typeof body.tier !== 'string') return NextResponse.json({ error: 'Choose an existing plan' }, { status: 400 });
  const reason = 'reason' in body && typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 5 || reason.length > 500) return NextResponse.json({ error: 'Provide a reason between 5 and 500 characters' }, { status: 400 });
  const manual = !('manual' in body) || body.manual !== false;
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const plan = await client.query('SELECT id FROM tiers WHERE id = $1', [body.tier]);
    if (!plan.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'This plan does not exist' }, { status: 400 }); }
    const current = await client.query('SELECT tier, manual_override, override_reason FROM organizations WHERE id = $1 FOR UPDATE', [id]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Organization not found' }, { status: 404 }); }
    const updated = await client.query('UPDATE organizations SET tier = $1, manual_override = $2, override_reason = $3, updated_at = NOW() WHERE id = $4 RETURNING tier, manual_override, override_reason', [body.tier, manual, manual ? reason : null, id]);
    await client.query('UPDATE users SET tier = $1 WHERE organization_id = $2', [body.tier, id]);
    await client.query("INSERT INTO subscription_history (organization_id,from_tier,to_tier,change_type,changed_by,reason) VALUES ($1,$2,$3,'admin_override',$4,$5)", [id, current.rows[0].tier, body.tier, actor.sub, reason]);
    await client.query("INSERT INTO audit_logs (actor_id,actor_email,actor_role,action,resource,resource_id,organization_id,before_state,after_state) VALUES ($1,$2,$3,'organization.plan_override','organization',$4::text,$4::uuid,$5,$6)", [actor.sub, actor.email, actor.role, id, JSON.stringify(current.rows[0]), JSON.stringify({ ...updated.rows[0], reason })]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true, organizationId: id, ...updated.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); console.error('Plan override failed:', error); return NextResponse.json({ error: 'Unable to update organization plan' }, { status: 500 }); }
  finally { client.release(); }
}
