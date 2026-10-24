import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, signToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type AuthUser = { role?: string; sub?: string } | null;

function isAdmin(user: AuthUser): user is { role: string; sub?: string; email?: string } {
  return !!user && (user.role === 'admin' || user.role === 'super_admin');
}

function clientIp(request: Request): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await query(
    `SELECT s.id, s.organization_id, o.name, o.slug, s.expires_at
     FROM impersonation_sessions s
     JOIN organizations o ON o.id = s.organization_id
     WHERE s.admin_id = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [user.sub]
  );

  return NextResponse.json({ session: result.rows[0] ?? null });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  const org = await query('SELECT id, name, slug FROM organizations WHERE id = $1', [organizationId]);
  if (org.rows.length === 0) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  await query(
    `UPDATE impersonation_sessions SET revoked_at = NOW() WHERE admin_id = $1 AND revoked_at IS NULL`,
    [user.sub]
  );

  const token = await signToken({
    sub: user.sub,
    email: user.email,
    role: user.role,
    orgId: organizationId,
    impersonatedBy: user.sub,
    type: 'impersonation',
  });

  await query(
    `INSERT INTO impersonation_sessions (id, admin_id, organization_id, token_hash, expires_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, NOW() + INTERVAL '1 hour')`,
    [user.sub, organizationId, token]
  );

  await logAudit({
    actorId: user.sub,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'impersonate.start',
    resource: 'organization',
    resourceId: organizationId,
    organizationId,
    afterState: { targetOrganization: org.rows[0] },
    ipAddress: clientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    organization: org.rows[0],
  });
}

export async function DELETE(request: Request) {
  const user = await getAuthUser(request);
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await query(
    `UPDATE impersonation_sessions SET revoked_at = NOW()
     WHERE admin_id = $1 AND revoked_at IS NULL
     RETURNING id`,
    [user.sub]
  );

  await logAudit({
    actorId: user.sub,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'impersonate.stop',
    resource: 'impersonation_session',
    resourceId: result.rows[0]?.id,
    afterState: { revoked: result.rowCount > 0 },
    ipAddress: clientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({ revoked: result.rowCount > 0 });
}
