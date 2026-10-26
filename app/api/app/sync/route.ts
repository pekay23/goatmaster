import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getAuthUser } from '@/lib/auth';
import { getClient, query } from '@/lib/db';
import { isSyncEntity, syncRecords } from '@/lib/sync-records';
import { validateRecordInput } from '@/lib/input-validation';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const entity = params.get('entity');
  if (!entity) {
    const result = await query("SELECT * FROM sync_queue WHERE organization_id = $1 AND status = 'pending' ORDER BY created_at LIMIT 100", [user.orgId]);
    return NextResponse.json({ queue: result.rows });
  }
  if (!isSyncEntity(entity)) return NextResponse.json({ error: 'Unknown record type' }, { status: 400 });
  let timestamp = '1970-01-01T00:00:00.000Z'; let id = '00000000-0000-4000-8000-000000000000';
  if (params.get('cursor')) {
    try { const decoded = JSON.parse(Buffer.from(params.get('cursor') || '', 'base64url').toString()); if (typeof decoded.timestamp !== 'string' || !Number.isFinite(Date.parse(decoded.timestamp)) || typeof decoded.id !== 'string' || !uuid.test(decoded.id)) throw new Error(); timestamp = decoded.timestamp; id = decoded.id; }
    catch { return NextResponse.json({ error: 'Invalid sync cursor' }, { status: 400 }); }
  }
  const result = await query('SELECT *, updated_at::text AS sync_timestamp FROM ' + entity + ' WHERE organization_id = $1 AND (updated_at,id) > ($2::timestamp,$3::uuid) ORDER BY updated_at,id LIMIT 501', [user.orgId, timestamp, id]);
  const records = result.rows.slice(0,500); const last = records.at(-1);
  const nextCursor = last ? Buffer.from(JSON.stringify({ timestamp: last.sync_timestamp, id: last.id })).toString('base64url') : params.get('cursor');
  return NextResponse.json({ records, nextCursor, hasMore: result.rows.length > 500 });
}
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { entity, entityId, operationId, baseVersion } = body;
  if (body.scope !== user.orgId + ':' + user.sub) return NextResponse.json({ error: 'The signed-in account changed. Sign in to the original account to synchronize these changes.' }, { status: 403 });
  const operation = typeof body.operation === 'string' ? body.operation.toUpperCase() : '';
  if (!isSyncEntity(entity) || typeof entityId !== 'string' || !uuid.test(entityId) || typeof operationId !== 'string' || !uuid.test(operationId) || !['CREATE','UPDATE','DELETE'].includes(operation)) return NextResponse.json({ error: 'Invalid sync operation' }, { status: 400 });
  if (operation !== 'CREATE' && (!Number.isSafeInteger(baseVersion) || baseVersion < 1)) return NextResponse.json({ error: 'The original record version is required' }, { status: 400 });
  const data = typeof body.data === 'object' && body.data !== null && !Array.isArray(body.data) ? body.data : {};
  const invalid = validateRecordInput('/api/' + entity, data);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  if(operation!=='DELETE') {
    const required = entity==='goats'||entity==='inventory'?['name']:entity==='health_records'?['goat_id','type','record_date']:entity==='breeding_records'?['dam_id','mating_date']:entity==='weight_records'?['goat_id','record_date','weight_kg']:entity==='milk_records'?['goat_id','record_date']:entity==='farm_events'?['subject','event_date']:[];
    if(required.some(key=>(operation==='CREATE'||Object.hasOwn(data,key))&&(data[key]===null||data[key]===undefined||data[key]==='')))return NextResponse.json({error:'Required record fields cannot be empty'},{status:400});
    if(entity==='goats'&&data.sex!==undefined&&!['male','female','unknown'].includes(data.sex))return NextResponse.json({error:'Invalid sex'},{status:400});
    if(entity==='weight_records'&&data.weight_kg!==undefined&&Number(data.weight_kg)<=0)return NextResponse.json({error:'Weight must be greater than zero'},{status:400});
  }
  const fields = syncRecords[entity].filter(key => Object.hasOwn(data,key));
  const values = fields.map(key => typeof data[key] === 'object' && data[key] !== null ? JSON.stringify(data[key]) : data[key] === '' && (key.endsWith('_id') || key.endsWith('_date') || key === 'dob') ? null : data[key]);
  const hash = createHash('sha256').update(JSON.stringify({ entity, entityId, operation, baseVersion, data })).digest('hex');
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const claim = await client.query('INSERT INTO sync_mutations (organization_id, operation_id, request_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING operation_id', [user.orgId,operationId,hash]);
    if (!claim.rowCount) {
      const previous = await client.query('SELECT request_hash,result FROM sync_mutations WHERE organization_id = $1 AND operation_id = $2', [user.orgId,operationId]);
      await client.query('ROLLBACK');
      if (previous.rows[0]?.request_hash !== hash) return NextResponse.json({ error: 'Operation ID was already used for another change' }, { status: 409 });
      return NextResponse.json(previous.rows[0].result);
    }
    const existing = await client.query('SELECT * FROM ' + entity + ' WHERE id = $1 AND organization_id = $2 FOR UPDATE', [entityId,user.orgId]);
    const current = existing.rows[0];
    if ((operation === 'CREATE' && current) || (operation !== 'CREATE' && (!current || current.deleted_at || current.version !== baseVersion))) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'This record changed on another device. Review both versions before retrying.', conflict: true, current: current ?? null }, { status: 409 });
    }
    let result;
    if(entity==='farm_events'&&operation==='CREATE'&&data.goat_id){
      const animal=await client.query('SELECT id FROM goats WHERE id=$1 AND organization_id=$2 AND deleted_at IS NULL',[data.goat_id,user.orgId]);
      if(!animal.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Animal not found'},{status:404});}
    }
    if (operation === 'CREATE') {
      const columns = ['id','organization_id','owner_id',...fields];
      result = await client.query('INSERT INTO ' + entity + ' (' + columns.join(',') + ') VALUES (' + columns.map((_,i) => '$' + (i+1)).join(',') + ') RETURNING *', [entityId,user.orgId,user.sub,...values]);
      if(entity==='farm_events'&&data.goat_id)await client.query('INSERT INTO farm_event_goats (organization_id,owner_id,event_id,goat_id) VALUES ($1,$2,$3,$4)',[user.orgId,user.sub,entityId,data.goat_id]);
    } else if (operation === 'DELETE') result = await client.query('UPDATE ' + entity + ' SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2 RETURNING *', [entityId,user.orgId]);
    else {
      if (!fields.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'No fields to update' }, { status: 400 }); }
      result = await client.query('UPDATE ' + entity + ' SET ' + fields.map((field,i)=>field+'=$'+(i+1)).join(',') + ' WHERE id = $' + (values.length+1) + ' AND organization_id = $' + (values.length+2) + ' RETURNING *', [...values,entityId,user.orgId]);
    }
    const response = { success: true, record: result.rows[0] };
    await client.query('UPDATE sync_mutations SET result = $1 WHERE organization_id = $2 AND operation_id = $3', [JSON.stringify(response),user.orgId,operationId]);
    await client.query('COMMIT');
    return NextResponse.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (['23502','23503','23514','22P02','22007'].includes(String(code))) return NextResponse.json({ error: 'The change has invalid fields, references, or exceeds your plan limit' }, { status: 400 });
    console.error('Sync mutation failed:',error);
    return NextResponse.json({ error: 'Unable to synchronize this change' }, { status: 500 });
  } finally { client.release(); }
}
