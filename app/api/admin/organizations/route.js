import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { hasAdminPermission } from '@/lib/admin-auth';
import { getAdminActor, organizationInput, pagination } from '@/app/api/admin/access';
export async function GET(request) {
  const actor = await getAdminActor(request, 'organizations:read');
  if (!actor) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = pagination(searchParams);
    const search = (searchParams.get('search') || '').trim().slice(0, 200);
    const sorting = { newest: 'o.created_at DESC, o.id', oldest: 'o.created_at ASC, o.id', name: 'o.name ASC, o.id', members: 'member_count DESC, o.id' };
    const sort = Object.hasOwn(sorting, searchParams.get('sort')) ? searchParams.get('sort') : 'newest';
    const values = [search, '%' + search + '%', searchParams.get('tier') || '', searchParams.get('status') || '', ['all','live','sample'].includes(searchParams.get('sample')) ? searchParams.get('sample') : 'all'];
    const where = "WHERE ($1 = '' OR o.name ILIKE $2 OR o.slug ILIKE $2 OR COALESCE(o.custom_domain, '') ILIKE $2) AND ($3 = '' OR o.tier = $3) AND ($4 = '' OR o.subscription_status = $4) AND ($5 = 'all' OR o.is_demo = ($5 = 'sample'))";
    const [count, result] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM organizations o ' + where, values),
      query("SELECT o.id, o.name, o.slug, o.tier, o.custom_domain, o.subscription_status, o.created_at, o.is_demo, (SELECT COUNT(*)::int FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'active') AS member_count, (SELECT COUNT(*)::int FROM goats g WHERE g.organization_id = o.id AND g.deleted_at IS NULL) AS goat_count FROM organizations o " + where + ' ORDER BY ' + sorting[sort] + ' LIMIT $6 OFFSET $7', [...values, limit, offset]),
    ]);
    const total = count.rows[0].count;
    return NextResponse.json({ organizations: result.rows, total, totalPages: Math.ceil(total / limit), page, limit, canCreate: hasAdminPermission(actor, 'organizations:write') });
  } catch (error) { console.error('Organizations list failed:', error); return NextResponse.json({ error: 'Unable to load organizations' }, { status: 500 }); }
}
export async function POST(request) {
  const actor = await getAdminActor(request, 'organizations:write');
  if (!actor) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await request.json();
  const parsed = organizationInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const tier = typeof body.tier === 'string' ? body.tier : 'free';
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const plan = await client.query('SELECT id FROM tiers WHERE id = $1', [tier]);
    if (!plan.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Choose an existing plan' }, { status: 400 }); }
    const result = await client.query('INSERT INTO organizations (name, slug, tier, custom_domain) VALUES ($1, $2, $3, $4) RETURNING *', [parsed.name, parsed.slug, tier, parsed.custom_domain]);
    const org = result.rows[0];
    await client.query("INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, resource, resource_id, organization_id, after_state) VALUES ($1,$2,$3,'organization.create','organization',$4::text,$4::uuid,$5)", [actor.sub, actor.email, actor.role, org.id, JSON.stringify(org)]);
    await client.query('COMMIT');
    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return NextResponse.json({ error: 'This slug or domain is already in use' }, { status: 409 }); console.error('Create organization failed:', error); return NextResponse.json({ error: 'Unable to create organization' }, { status: 500 }); }
  finally { client.release(); }
}
