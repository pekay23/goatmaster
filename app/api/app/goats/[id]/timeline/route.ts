import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError, uuid } from '../../../_records';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  try {
    const goat = await query(`SELECT g.*, dam.name AS dam_name, sire.name AS sire_name FROM goats g
      LEFT JOIN goats dam ON dam.id = g.dam_id AND dam.organization_id = g.organization_id
      LEFT JOIN goats sire ON sire.id = g.sire_id AND sire.organization_id = g.organization_id
      WHERE g.id = $1 AND g.organization_id = $2 AND g.deleted_at IS NULL`, [id, user.orgId]);
    if (!goat.rowCount) return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    const timeline = await query(`SELECT * FROM (
      SELECT h.id, 'health' AS kind, COALESCE(NULLIF(h.treatment, ''), h.type) AS title, h.record_date AS occurred_at,
        COALESCE(h.notes, '') AS detail, '/health/' || h.id::text AS href FROM health_records h
      WHERE h.goat_id = $1 AND h.organization_id = $2 AND h.deleted_at IS NULL
      UNION ALL
      SELECT b.id, 'breeding', 'Breeding · ' || b.status, COALESCE(b.actual_kidding_date, b.mating_date, b.created_at),
        COALESCE(b.notes, ''), '/breeding/' || b.id::text FROM breeding_records b
      WHERE (b.dam_id = $1 OR b.sire_id = $1) AND b.organization_id = $2 AND b.deleted_at IS NULL
      UNION ALL
      SELECT w.id, 'weight', w.weight_kg::text || ' kg recorded', w.record_date, COALESCE(w.notes, ''), '/weights/' || w.id::text
      FROM weight_records w WHERE w.goat_id = $1 AND w.organization_id = $2 AND w.deleted_at IS NULL
      UNION ALL
      SELECT m.id, 'milk', (COALESCE(m.morning_yield, 0) + COALESCE(m.evening_yield, 0))::text || ' L recorded', m.record_date, COALESCE(m.notes, ''), '/milk/' || m.id::text
      FROM milk_records m WHERE m.goat_id = $1 AND m.organization_id = $2 AND m.deleted_at IS NULL
      UNION ALL
      SELECT e.id, 'event', e.subject, e.event_date, COALESCE(e.details, ''), '/events/' || e.id::text
      FROM farm_events e JOIN farm_event_goats eg ON eg.event_id = e.id AND eg.organization_id = e.organization_id
      WHERE eg.goat_id = $1 AND e.organization_id = $2 AND e.deleted_at IS NULL
    ) history ORDER BY occurred_at DESC, id DESC LIMIT 200`, [id, user.orgId]);
    return NextResponse.json({ record: goat.rows[0], timeline: timeline.rows });
  } catch (error) { return apiError(error, 'Unable to load animal history'); }
}
