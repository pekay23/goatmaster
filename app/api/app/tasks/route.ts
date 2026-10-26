import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError } from '../_records';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query(`WITH latest_health AS (
      SELECT DISTINCT ON (goat_id, type) id, goat_id, type, treatment, next_due_date
      FROM health_records WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY goat_id, type, record_date DESC, created_at DESC, id DESC
    ), tasks AS (
      SELECT 'health:' || h.id::text AS id, 'health' AS kind, COALESCE(NULLIF(h.treatment, ''), h.type) || ' · ' || g.name AS title,
        h.next_due_date AS due_at, g.id AS goat_id, '/health/new?goatId=' || g.id::text || '&type=' || h.type AS href,
        'Record treatment' AS action, NULL::uuid AS event_id
      FROM latest_health h JOIN goats g ON g.id = h.goat_id AND g.organization_id = $1 AND g.deleted_at IS NULL
      WHERE h.next_due_date < CURRENT_DATE + INTERVAL '8 days'
      UNION ALL
      SELECT 'breeding:' || b.id::text, 'breeding', 'Kidding expected · ' || g.name, b.expected_kidding_date,
        g.id, '/breeding/' || b.id::text || '/edit', 'Update breeding record', NULL::uuid
      FROM breeding_records b JOIN goats g ON g.id = b.dam_id AND g.organization_id = b.organization_id AND g.deleted_at IS NULL
      WHERE b.organization_id = $1 AND b.deleted_at IS NULL AND b.status IN ('mated', 'confirmed') AND b.actual_kidding_date IS NULL AND b.expected_kidding_date < CURRENT_DATE + INTERVAL '8 days'
      UNION ALL
      SELECT 'event:' || e.id::text, 'event', e.subject, e.event_date, NULL::uuid, '/events/' || e.id::text, 'View event', e.id
      FROM farm_events e WHERE e.organization_id = $1 AND e.deleted_at IS NULL AND e.completed_at IS NULL AND e.event_date < CURRENT_DATE + INTERVAL '8 days'
      UNION ALL
      SELECT 'stock:' || i.id::text, 'inventory', 'Restock · ' || i.name, CURRENT_DATE::timestamp, NULL::uuid,
        '/inventory/' || i.id::text || '/edit', 'Update stock', NULL::uuid
      FROM inventory i WHERE i.organization_id = $1 AND i.deleted_at IS NULL AND i.quantity <= i.low_stock_threshold
    ) SELECT *, CASE WHEN due_at::date < CURRENT_DATE THEN 'overdue' WHEN due_at::date = CURRENT_DATE THEN 'today' ELSE 'upcoming' END AS bucket
    FROM tasks ORDER BY due_at ASC, id ASC LIMIT 100`, [user.orgId]);
    return NextResponse.json({ tasks: result.rows });
  } catch (error) { return apiError(error, 'Unable to load farm tasks'); }
}
