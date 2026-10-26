import { NextResponse } from 'next/server';
import { getClient, query } from '@/lib/db';
import { hasAdminPermission } from '@/lib/admin-auth';
import { getAdminActor, isUuid, organizationInput } from '@/app/api/admin/access';
export async function GET(request, { params }) {
  const actor = await getAdminActor(request, 'organizations:read');
  if (!actor) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
  try {
    const org = await query('SELECT o.is_demo, o.id, o.name, o.slug, o.tier, o.custom_domain, o.subscription_status, o.current_period_end, o.cancel_at_period_end, o.manual_override, o.override_reason, o.created_at, t.name AS plan_name, t.price_cents, t.max_goats, t.max_scans_per_day FROM organizations o LEFT JOIN tiers t ON t.id = o.tier WHERE o.id = $1', [id]);
    if (!org.rowCount) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    const [members, usage, payments, activity, history, webhooks, sync] = await Promise.all([
      query('SELECT u.id, u.email, u.username, m.role, m.status, u.created_at FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = $1 ORDER BY m.role, u.created_at DESC', [id]),
      query("SELECT (SELECT COUNT(*)::int FROM goats WHERE organization_id = $1 AND deleted_at IS NULL) AS goats, (SELECT COUNT(*)::int FROM health_records WHERE organization_id = $1 AND deleted_at IS NULL) AS health_records, (SELECT COUNT(*)::int FROM breeding_records WHERE organization_id = $1 AND deleted_at IS NULL) AS breeding_records, (SELECT COUNT(*)::int FROM inventory WHERE organization_id = $1 AND deleted_at IS NULL) AS inventory_items, (SELECT COUNT(*)::int FROM scan_history WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '7 days') AS scans_7d, (SELECT COUNT(*)::int FROM scan_history WHERE organization_id = $1 AND created_at >= date_trunc('day', NOW())) AS scans_today, (SELECT COUNT(*)::int FROM sync_queue WHERE organization_id = $1 AND status IN ('pending','failed')) AS pending_sync", [id]),
      query('SELECT id, reference, email, amount, status, tier, created_at FROM payments WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50', [id]),
      query('SELECT id, action, resource, actor_email, actor_role, before_state, after_state, created_at FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100', [id]),
      query('SELECT id, from_tier, to_tier, change_type, changed_by, reason, created_at FROM subscription_history WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50', [id]),
      query('SELECT id, event_type, status, error_message, created_at FROM billing_events WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20', [id]),
      query("SELECT id, entity, operation, status, attempts, last_error, created_at FROM sync_queue WHERE organization_id = $1 AND status IN ('pending','failed') ORDER BY created_at ASC LIMIT 50", [id]),
    ]);
    return NextResponse.json({ organization: org.rows[0], members: members.rows, usage: usage.rows[0], payments: hasAdminPermission(actor, 'billing:read') ? payments.rows : [], activity: activity.rows, subscriptionHistory: history.rows, webhooks: hasAdminPermission(actor, 'billing:read') ? webhooks.rows : [], permissions: { canEdit: hasAdminPermission(actor, 'organizations:write'), canOverride: hasAdminPermission(actor, 'billing:write'), canReadBilling: hasAdminPermission(actor, 'billing:read') }, pendingSync: sync.rows });
  } catch (error) { console.error('Organization workspace failed:', error); return NextResponse.json({ error: 'Unable to load organization workspace' }, { status: 500 }); }
}
export async function PUT(request, { params }) {
  const actor = await getAdminActor(request, 'organizations:write');
  if (!actor) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
  const body = await request.json();
  if (body.tier !== undefined) return NextResponse.json({ error: 'Use the plan override action and provide a reason to change tiers' }, { status: 400 });
  const parsed = organizationInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT name, slug, custom_domain FROM organizations WHERE id = $1 FOR UPDATE', [id]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Organization not found' }, { status: 404 }); }
    const updated = await client.query('UPDATE organizations SET name = $2, slug = $3, custom_domain = $4, updated_at = NOW() WHERE id = $1 RETURNING id, name, slug, custom_domain', [id, parsed.name, parsed.slug, parsed.custom_domain]);
    await client.query("INSERT INTO audit_logs (actor_id,actor_email,actor_role,action,resource,resource_id,organization_id,before_state,after_state) VALUES ($1,$2,$3,'organization.update','organization',$4::text,$4::uuid,$5,$6)", [actor.sub, actor.email, actor.role, id, JSON.stringify(current.rows[0]), JSON.stringify(updated.rows[0])]);
    await client.query('COMMIT');
    return NextResponse.json(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return NextResponse.json({ error: 'This slug or domain is already in use' }, { status: 409 }); console.error('Organization update failed:', error); return NextResponse.json({ error: 'Unable to update organization' }, { status: 500 }); }
  finally { client.release(); }
}
export async function DELETE(request, { params }) {
  const actor = await getAdminActor(request,'organizations:write');
  if (!actor || actor.role !== 'super_admin') return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id,name,slug FROM organizations WHERE id = $1 FOR UPDATE', [id]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Organization not found' }, { status: 404 }); }
    const members = await client.query("SELECT COUNT(*)::int AS count FROM organization_members WHERE organization_id = $1 AND status = 'active'", [id]);
    if (members.rows[0].count > 0) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Move or remove active members before deleting an organization' }, { status: 409 }); }
    await client.query('DELETE FROM organizations WHERE id = $1', [id]);
    await client.query("INSERT INTO audit_logs (actor_id,actor_email,actor_role,action,resource,resource_id,before_state) VALUES ($1,$2,$3,'organization.delete','organization',$4,$5)", [actor.sub, actor.email, actor.role, id, JSON.stringify(current.rows[0])]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23503') return NextResponse.json({ error: 'Retained records reference this organization; deletion is unavailable' }, { status: 409 }); console.error('Organization delete failed:', error); return NextResponse.json({ error: 'Unable to delete organization' }, { status: 500 }); }
  finally { client.release(); }
}
