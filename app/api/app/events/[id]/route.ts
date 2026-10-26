import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError, isObject, recordVersion, uuid, validDate } from '../../_records';

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  try {
    const result = await query('SELECT * FROM farm_events WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL', [id, user.orgId]);
    if (!result.rowCount) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const linked = await query('SELECT g.id, g.name FROM farm_event_goats eg JOIN goats g ON g.id = eg.goat_id AND g.organization_id = eg.organization_id AND g.deleted_at IS NULL WHERE eg.event_id = $1 AND eg.organization_id = $2', [id, user.orgId]);
    return NextResponse.json({ record: { ...result.rows[0], goats: linked.rows } });
  } catch (error) { return apiError(error, 'Unable to load event'); }
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  try {
    const body: unknown = await request.json();
    if (!isObject(body) || !validDate(body.event_date) || body.subject !== undefined && (typeof body.subject !== 'string' || !body.subject.trim())) return NextResponse.json({ error: 'Enter a valid event title and date' }, { status: 400 });
    const version = body.version === undefined ? null : recordVersion(body.version);
    if (body.version !== undefined && version === null) return NextResponse.json({ error: 'Invalid record version' }, { status: 400 });
    const result = await query(`UPDATE farm_events SET subject = COALESCE($1, subject), details = COALESCE($2, details), category = COALESCE($3, category), event_date = COALESCE($4, event_date), completed_at = CASE WHEN $5::boolean = true THEN NOW() WHEN $5::boolean = false THEN NULL ELSE completed_at END, updated_at = NOW() WHERE id = $6 AND organization_id = $7 AND deleted_at IS NULL AND ($8::integer IS NULL OR version = $8) RETURNING *`, [typeof body.subject === 'string' ? body.subject.trim() : null, typeof body.details === 'string' ? body.details : null, typeof body.category === 'string' ? body.category : null, body.event_date || null, typeof body.completed === 'boolean' ? body.completed : null, id, user.orgId, version]);
    if (!result.rowCount) {
      const existing = await query('SELECT id FROM farm_events WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL', [id, user.orgId]);
      return NextResponse.json({ error: existing.rowCount ? 'This event changed. Reload before saving.' : 'Event not found' }, { status: existing.rowCount ? 409 : 404 });
    }
    return NextResponse.json({ record: result.rows[0] });
  } catch (error) { return apiError(error, 'Unable to update event'); }
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  try {
    const expected = request.headers.get('if-match');
    const version = expected === null ? null : Number(expected.replaceAll('"', ''));
    if (version !== null && (!Number.isSafeInteger(version) || version < 1)) return NextResponse.json({ error: 'Invalid record version' }, { status: 400 });
    const result = await query('UPDATE farm_events SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL AND ($3::integer IS NULL OR version = $3) RETURNING id', [id, user.orgId, version]);
    if (!result.rowCount) return NextResponse.json({ error: 'Event was changed or removed. Reload your records.' }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete event'); }
}
