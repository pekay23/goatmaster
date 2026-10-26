import { NextResponse } from 'next/server';
import { getClient, query } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/auth';

export async function GET(request) {
  if(!await getAdminActor(request,'users:read'))return NextResponse.json({error:'Permission denied'},{status:403});
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));
    const search = (searchParams.get('search') || '').slice(0, 200);
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE (email ILIKE $1 OR username ILIKE $1)';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    const params2 = [...params, limit, offset];
    const result = await query(
      `SELECT id, email, username, role, organization_id, is_demo, COALESCE((SELECT tier FROM organizations WHERE id=users.organization_id), 'free') as tier,
        COALESCE((SELECT tier FROM organizations WHERE id=users.organization_id), 'free') as subscription_tier, created_at,
        (SELECT COUNT(*) FROM goats WHERE organization_id = users.organization_id AND deleted_at IS NULL) as goat_count
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params2
    );

    return NextResponse.json({
      users: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request) {
  const actor=await getAdminActor(request,'users:write');
  if(!actor)return NextResponse.json({error:'Permission denied'},{status:403});
  const client = await getClient();
  try {
    const { email, password, username, organization_id } = await request.json();

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanUsername = String(username || '').trim();
    if (!normalizedEmail || !password || !cleanUsername || !organization_id) {
      return NextResponse.json({ error: 'Email, password, username, and organization are required' }, { status: 400 });
    }
    if (typeof password!=='string'||password.length<10||Buffer.byteLength(password)>72) return NextResponse.json({error:'Password must be at least 10 characters and at most 72 bytes'},{status:400});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)||normalizedEmail.length>254||cleanUsername.length>100||typeof organization_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(organization_id))return NextResponse.json({error:'Invalid account details'},{status:400});

    const password_hash = await hashPassword(password);
    await client.query('BEGIN');
    const org = await client.query('SELECT id,tier,is_demo FROM organizations WHERE id = $1 FOR KEY SHARE', [organization_id]);
    if (!org.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, username, role, tier, organization_id, is_demo)
       VALUES ($1, $2, $3, 'user', $4, $5, $6)
       RETURNING id, email, username, role, tier, organization_id, created_at`,
      [normalizedEmail, password_hash, cleanUsername, org.rows[0].tier, organization_id, org.rows[0].is_demo]
    );
    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role, status)
       VALUES ($1, $2, 'member', 'active') ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [organization_id, rows[0].id]
    );
    await client.query('INSERT INTO audit_logs(actor_id,actor_email,actor_role,action,resource,resource_id,organization_id,after_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[actor.sub,actor.email,actor.role,'user.created','user',rows[0].id,organization_id,JSON.stringify(rows[0])]);
    await client.query('COMMIT');

    return NextResponse.json({ data: { ...rows[0], subscription_tier: rows[0].tier }, is_active: true }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err?.code === '23505') return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  } finally {
    client.release();
  }
}
