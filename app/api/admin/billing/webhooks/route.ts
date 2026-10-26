import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';


export async function GET(request: Request) {
  const user = await getAdminActor(request, 'billing:read');
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.min(100000, Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1));
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10) || 25, 1), 100);
    const eventType = searchParams.get('eventType') || '';
    const status = searchParams.get('status') || '';
    const orgId = searchParams.get('orgId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [searchParams.get('include_demo') === 'true'];

    const conditions: string[] = ['($1 OR NOT EXISTS(SELECT 1 FROM organizations o WHERE o.id = billing_events.organization_id AND o.is_demo))'];
    if (eventType) {
      conditions.push(`event_type ILIKE $${params.length + 1}`);
      params.push(`%${eventType}%`);
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
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

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM billing_events ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const paramsWithPagination = [...params, limit, offset];
    const result = await query(
      `SELECT * FROM billing_events ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      paramsWithPagination
    );

    return NextResponse.json({
      webhooks: result.rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error('Admin billing webhooks error:', err);
    return NextResponse.json({ error: 'Failed to load webhook logs' }, { status: 500 });
  }
}