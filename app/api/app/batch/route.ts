import { featureAccessError } from '@/lib/plan-access';
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getAuthUser } from '@/lib/auth';
import { getClient } from '@/lib/db';
import { apiError,isObject,uuid,validDate } from '../_records';
export async function POST(request:Request){
  const user=await getAuthUser(request);if(!user?.orgId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body:unknown=await request.json();
  if(!isObject(body)||!['health','weight','milk'].includes(String(body.kind))||typeof body.operationId!=='string'||!uuid.test(body.operationId)||!Array.isArray(body.entries)||!body.entries.length||body.entries.length>100||!isObject(body.shared))return NextResponse.json({error:'Choose a record type and between 1 and 100 animals'},{status:400});
  const entries=body.entries;const shared=body.shared;const kind=String(body.kind);
  if(kind==='health'){const denied=await featureAccessError(request,'health_records');if(denied)return denied;}
  if(!shared.record_date||!validDate(shared.record_date)||!entries.every(isObject))return NextResponse.json({error:'A valid date and animal records are required'},{status:400});
  const goatIds=entries.map(entry=>entry.goat_id);
  if(goatIds.some(value=>typeof value!=='string'||!uuid.test(value))||new Set(goatIds).size!==goatIds.length)return NextResponse.json({error:'Select each animal only once'},{status:400});
  if(kind==='health'&&(!['vaccination','deworming','treatment','checkup','injury','illness','supplement','other'].includes(String(shared.type))||!validDate(shared.next_due_date)||!Number.isFinite(Number(shared.cost??0))||Number(shared.cost??0)<0))return NextResponse.json({error:'Check treatment type, date, and cost'},{status:400});
  if(kind!=='health'&&entries.some(entry=>(kind==='weight'?['weight_kg']:['morning_yield','evening_yield']).some(field=>!Number.isFinite(Number(entry[field]??0))||Number(entry[field]??0)<0)||kind==='weight'&&Number(entry.weight_kg??0)<=0))return NextResponse.json({error:'Enter valid measurements for every selected animal'},{status:400});
  const client=await getClient();
  try{
    await client.query('BEGIN');const hash=createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const receipt=await client.query('INSERT INTO sync_mutations(organization_id,operation_id,request_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING operation_id',[user.orgId,body.operationId,hash]);
    if(!receipt.rowCount){const existing=await client.query('SELECT request_hash,result FROM sync_mutations WHERE organization_id=$1 AND operation_id=$2',[user.orgId,body.operationId]);await client.query('ROLLBACK');return existing.rows[0]?.request_hash===hash?NextResponse.json(existing.rows[0].result):NextResponse.json({error:'This operation ID was used for another batch'},{status:409});}
    const goats=await client.query('SELECT id FROM goats WHERE organization_id=$1 AND id=ANY($2::uuid[]) AND deleted_at IS NULL FOR KEY SHARE',[user.orgId,goatIds]);
    if(goats.rowCount!==entries.length){await client.query('ROLLBACK');return NextResponse.json({error:'Every animal must belong to this farm'},{status:400});}
    const saved=[];
    for(const entry of entries){
      let result;
      if(kind==='health')result=await client.query('INSERT INTO health_records(organization_id,owner_id,goat_id,type,treatment,cost,record_date,next_due_date,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[user.orgId,user.sub,entry.goat_id,shared.type,shared.treatment||null,Number(shared.cost??0),shared.record_date,shared.next_due_date||null,shared.notes||null]);
      else if(kind==='weight')result=await client.query('INSERT INTO weight_records(organization_id,owner_id,goat_id,weight_kg,record_date,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[user.orgId,user.sub,entry.goat_id,Number(entry.weight_kg),shared.record_date,shared.notes||null]);
      else result=await client.query('INSERT INTO milk_records(organization_id,owner_id,goat_id,morning_yield,evening_yield,record_date,notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[user.orgId,user.sub,entry.goat_id,Number(entry.morning_yield??0),Number(entry.evening_yield??0),shared.record_date,shared.notes||null]);
      saved.push(result.rows[0]);
    }
    const response={success:true,count:saved.length,records:saved};await client.query('UPDATE sync_mutations SET result=$1 WHERE organization_id=$2 AND operation_id=$3',[JSON.stringify(response),user.orgId,body.operationId]);await client.query('COMMIT');return NextResponse.json(response,{status:201});
  }catch(error){await client.query('ROLLBACK');return apiError(error,'Unable to save the batch');}finally{client.release();}
}
