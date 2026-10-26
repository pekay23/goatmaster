import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getClient } from '@/lib/db';
import { listRecords } from '../_listing';
import { apiError, isObject, uuid, validDate } from '../_records';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, 'events')); }
  catch (error) { return apiError(error, 'Unable to load events'); }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body: unknown = await request.json();
  if (!isObject(body) || typeof body.subject !== 'string' || !body.subject.trim() || body.subject.length > 500 || !body.event_date || !validDate(body.event_date)) return NextResponse.json({ error: 'An event title and valid date are required' }, { status: 400 });
  if (body.goat_id && (typeof body.goat_id !== 'string' || !uuid.test(body.goat_id))) return NextResponse.json({ error: 'Invalid animal' }, { status: 400 });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    if (body.goat_id) {
      const goat = await client.query('SELECT id FROM goats WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL', [body.goat_id, user.orgId]);
      if (!goat.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Animal not found' }, { status: 404 }); }
    }
    const result = await client.query('INSERT INTO farm_events (organization_id, owner_id, subject, details, category, event_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [user.orgId, user.sub, body.subject.trim(), typeof body.details === 'string' ? body.details : '', typeof body.category === 'string' ? body.category : 'General', body.event_date]);
    if (body.goat_id) await client.query('INSERT INTO farm_event_goats (organization_id, owner_id, event_id, goat_id) VALUES ($1,$2,$3,$4)', [user.orgId, user.sub, result.rows[0].id, body.goat_id]);
    await client.query('COMMIT');
    return NextResponse.json({ record: result.rows[0] }, { status: 201 });
  } catch (error) { await client.query('ROLLBACK'); return apiError(error, 'Unable to save event'); }
  finally { client.release(); }
}
