import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError, isObject, recordVersion, uuid, validDate } from './_records';
import { listRecords } from './_listing';

type Kind = 'weights' | 'milk';
const tables = { weights: 'weight_records', milk: 'milk_records' };

export async function getMeasurements(request: Request, kind: Kind) {
  const user = await getAuthUser(request);
  if (typeof user?.orgId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await listRecords(request, user.orgId, kind)); }
  catch (error) { return apiError(error, 'Unable to load measurements'); }
}

export async function createMeasurement(request: Request, kind: Kind) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isObject(body) || typeof body.goat_id !== 'string' || !uuid.test(body.goat_id) || !validDate(body.record_date)) return NextResponse.json({ error: 'A valid animal and date are required' }, { status: 400 });
    const fields = kind === 'weights' ? ['weight_kg'] : ['morning_yield', 'evening_yield'];
    const values = fields.map(field => Number(body[field] ?? 0));
    if (values.some(value => !Number.isFinite(value) || value < 0) || kind === 'weights' && values[0] <= 0) return NextResponse.json({ error: 'Measurements must be valid positive numbers' }, { status: 400 });
    const goat = await query('SELECT id FROM goats WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL', [body.goat_id, user.orgId]);
    if (!goat.rowCount) return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    const result = await query(`INSERT INTO ${tables[kind]} (organization_id, owner_id, goat_id, record_date, notes, ${fields.join(', ')}) VALUES ($1,$2,$3,$4,$5,${fields.map((_, index) => '$' + (index + 6)).join(',')}) RETURNING *`, [user.orgId, user.sub, body.goat_id, body.record_date || new Date().toISOString(), typeof body.notes === 'string' ? body.notes : null, ...values]);
    return NextResponse.json({ record: result.rows[0] }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save measurement'); }
}

export async function measurementDetail(request: Request, id: string, kind: Kind) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  try {
    const result = await query(`SELECT r.*, g.name AS goat_name FROM ${tables[kind]} r JOIN goats g ON g.id = r.goat_id AND g.organization_id = r.organization_id AND g.deleted_at IS NULL WHERE r.id = $1 AND r.organization_id = $2 AND r.deleted_at IS NULL`, [id, user.orgId]);
    if (!result.rowCount) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    if (request.method === 'GET') return NextResponse.json({ record: result.rows[0] });
    if (request.method === 'DELETE') {
      await query(`UPDATE ${tables[kind]} SET deleted_at = NOW(), updated_at = NOW(), version = version + 1 WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`, [id, user.orgId]);
      return NextResponse.json({ success: true });
    }
    const body: unknown = await request.json();
    if (!isObject(body) || !validDate(body.record_date)) return NextResponse.json({ error: 'Invalid measurement values' }, { status: 400 });
    const existing = result.rows[0];
    const goatId = body.goat_id ?? existing.goat_id;
    if (typeof goatId !== 'string' || !uuid.test(goatId)) return NextResponse.json({ error: 'Select an animal' }, { status: 400 });
    const goat = await query('SELECT id FROM goats WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL', [goatId, user.orgId]);
    if (!goat.rowCount) return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    const fields = kind === 'weights' ? ['weight_kg'] : ['morning_yield', 'evening_yield'];
    const values = fields.map(field => Number(body[field] ?? existing[field]));
    if (values.some(value => !Number.isFinite(value) || value < 0) || kind === 'weights' && values[0] <= 0) return NextResponse.json({ error: 'Measurements must be valid positive numbers' }, { status: 400 });
    const version = body.version === undefined ? existing.version : recordVersion(body.version);
    if (version === null) return NextResponse.json({ error: 'Invalid record version' }, { status: 400 });
    const updated = await query(`UPDATE ${tables[kind]} SET goat_id = $1, record_date = $2, notes = $3, ${fields.map((field, index) => field + ' = $' + (index + 4)).join(', ')}, updated_at = NOW(), version = version + 1 WHERE id = $${values.length + 4} AND organization_id = $${values.length + 5} AND deleted_at IS NULL AND version = $${values.length + 6} RETURNING *`, [goatId, body.record_date || existing.record_date, typeof body.notes === 'string' ? body.notes : existing.notes, ...values, id, user.orgId, version]);
    if (!updated.rowCount) return NextResponse.json({ error: 'This record changed in another session. Reload before saving.' }, { status: 409 });
    return NextResponse.json({ record: updated.rows[0] });
  } catch (error) { return apiError(error, 'Unable to update measurement'); }
}
