import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getAdminActor(request, 'audit:read');
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const actor = searchParams.get('actor') || '';
  const action = searchParams.get('action') || '';
  const resource = searchParams.get('resource') || '';
  const orgId = searchParams.get('orgId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || '50'), 1), 500);
  const exportCsv = searchParams.get('export') === 'csv';
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || (orgId && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orgId)) || [dateFrom,dateTo].some(value=>value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))))) return NextResponse.json({error:'Invalid audit filters'},{status:400});
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (actor) {
    conditions.push(`actor_email ILIKE $${params.length + 1}`);
    params.push(`%${actor}%`);
  }
  if (action) {
    conditions.push(`action ILIKE $${params.length + 1}`);
    params.push(`%${action}%`);
  }
  if (resource) {
    conditions.push(`resource ILIKE $${params.length + 1}`);
    params.push(`%${resource}%`);
  }
  if (orgId) {
    conditions.push(`organization_id = $${params.length + 1}`);
    params.push(orgId);
  }
  if (dateFrom) {
    conditions.push(`created_at >= $${params.length + 1}`);
    params.push(`${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    conditions.push(`created_at <= $${params.length + 1}`);
    params.push(`${dateTo}T23:59:59`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*)::int as count FROM audit_logs ${where}`, params);
  const total = Number(countResult.rows[0]?.count ?? 0);

  if (exportCsv) {
    const result = await query(
      `SELECT actor_email, actor_role, action, resource, resource_id, organization_id, before_state, after_state, ip_address, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC LIMIT 10000`,
      params
    );

    const headers = [
      'Timestamp',
      'Actor Email',
      'Actor Role',
      'Action',
      'Resource',
      'Resource ID',
      'Organization ID',
      'Before State',
      'After State',
      'IP Address',
    ];

    const rows = result.rows.map((row: Record<string, unknown>) => [
      row.created_at,
      row.actor_email,
      row.actor_role,
      row.action,
      row.resource,
      row.resource_id,
      row.organization_id,
      JSON.stringify(row.before_state ?? {}),
      JSON.stringify(row.after_state ?? {}),
      row.ip_address,
    ]);

    const csv = [headers, ...rows.map(escapeRow)].join('\r\n');
    const date = new Date().toISOString().split('T')[0];

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${date}.csv"`,
      },
    });
  }

  const result = await query(
    `SELECT id, actor_id, actor_email, actor_role, action, resource, resource_id, organization_id, before_state, after_state, ip_address, user_agent, created_at
     FROM audit_logs ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return NextResponse.json({
    logs: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

function escapeRow(row: unknown[]) {
  return row.map(escapeCsvValue).join(',');
}

function escapeCsvValue(value: unknown): string {
  const raw = value == null ? '' : String(value);
  const s = /^[\s]*[=+@-]/.test(raw) ? "'" + raw : raw;
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
