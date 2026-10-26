import { featureAccessError } from '@/lib/plan-access';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getClient } from '@/lib/db';
import { syncRecords,type SyncEntity } from '@/lib/sync-records';
import { validateRecordInput } from '@/lib/input-validation';
import { apiError,isObject,uuid,recordVersion } from './_records';
export async function recordDetail(request:Request,id:string,entity:SyncEntity){
 const feature = entity === 'health_records' ? 'health_records' : entity === 'breeding_records' ? 'breeding' : entity === 'inventory' ? 'inventory' : null;
 if (feature) { const denied = await featureAccessError(request, feature); if (denied) return denied; }
 const user=await getAuthUser(request);if(!user?.orgId)return NextResponse.json({error:'Unauthorized'},{status:401});if(!uuid.test(id))return NextResponse.json({error:'Invalid record ID'},{status:400});
 const client=await getClient();let transaction=false;
 try{
  if(request.method!=='GET'){await client.query('BEGIN');transaction=true;}
  const result=await client.query('SELECT * FROM '+entity+' WHERE id=$1 AND organization_id=$2 AND deleted_at IS NULL'+(transaction?' FOR UPDATE':''),[id,user.orgId]);
  const current=result.rows[0];if(!current){if(transaction)await client.query('ROLLBACK');return NextResponse.json({error:'Record not found'},{status:404});}
  if(request.method==='GET'){
   if(entity==='inventory')current.min_quantity=current.low_stock_threshold;
   if(current.goat_id){const animal=await client.query('SELECT name FROM goats WHERE id=$1 AND organization_id=$2',[current.goat_id,user.orgId]);current.goat_name=animal.rows[0]?.name;}
   for(const key of ['dam_id','sire_id'])if(current[key]){const parent=await client.query('SELECT name FROM goats WHERE id=$1 AND organization_id=$2',[current[key],user.orgId]);current[key==='dam_id'?'dam_name':'sire_name']=parent.rows[0]?.name;}
   return NextResponse.json({record:current});
  }
  if(request.method==='DELETE'){
   const header=request.headers.get('if-match');const version=header?Number(header.replaceAll('"','')):current.version;
   if(!Number.isSafeInteger(version)||version<1){await client.query('ROLLBACK');return NextResponse.json({error:'Invalid record version'},{status:400});}
   if(version!==current.version){await client.query('ROLLBACK');return NextResponse.json({error:'This record changed. Reload before deleting.',conflict:true,current},{status:409});}
   await client.query('UPDATE '+entity+' SET deleted_at=NOW() WHERE id=$1 AND organization_id=$2',[id,user.orgId]);await client.query('COMMIT');return NextResponse.json({success:true});
  }
  const body:unknown=await request.json();if(!isObject(body)){await client.query('ROLLBACK');return NextResponse.json({error:'Invalid record values'},{status:400});}
  const version=body.version===undefined?current.version:recordVersion(body.version);
  if(!version||version!==current.version){await client.query('ROLLBACK');return NextResponse.json({error:'This record changed. Reload before saving.',conflict:true,current},{status:409});}
  if(entity==='inventory'&&body.min_quantity!==undefined&&body.low_stock_threshold===undefined)body.low_stock_threshold=body.min_quantity;
  const invalid=validateRecordInput(new URL(request.url).pathname,body);
  if(invalid){await client.query('ROLLBACK');return NextResponse.json({error:invalid},{status:400});}
  for(const field of ['name','type','sex'])if(field in body&&(typeof body[field]!=='string'||!body[field].trim())){await client.query('ROLLBACK');return NextResponse.json({error:field+' cannot be empty'},{status:400});}
  if(entity==='goats'&&body.sex!==undefined&&!['female','male','unknown'].includes(String(body.sex))){await client.query('ROLLBACK');return NextResponse.json({error:'Invalid sex'},{status:400});}
  if(entity==='goats'&&(body.dam_id===id||body.sire_id===id)){await client.query('ROLLBACK');return NextResponse.json({error:'An animal cannot be its own parent'},{status:400});}
  if(entity==='breeding_records'&&body.status!==undefined&&!['planned','mated','confirmed','kidded','failed'].includes(String(body.status))){await client.query('ROLLBACK');return NextResponse.json({error:'Invalid breeding status'},{status:400});}
  const reference = entity==='breeding_records'?'dam_id':['health_records','weight_records','milk_records'].includes(entity)?'goat_id':null;
  if(reference&&Object.hasOwn(body,reference)&&(typeof body[reference]!=='string'||!uuid.test(String(body[reference])))){await client.query('ROLLBACK');return NextResponse.json({error:'A valid animal is required'},{status:400});}
  if(entity==='weight_records'&&body.weight_kg!==undefined&&Number(body.weight_kg)<=0){await client.query('ROLLBACK');return NextResponse.json({error:'Weight must be greater than zero'},{status:400});}
  const fields=syncRecords[entity].filter(key=>Object.hasOwn(body,key));if(!fields.length){await client.query('ROLLBACK');return NextResponse.json({error:'No fields to update'},{status:400});}
  const values=fields.map(key=>body[key]===''&&(key.endsWith('_date')||key.endsWith('_id')||key==='dob')?null:body[key]);
  const updated=await client.query('UPDATE '+entity+' SET '+fields.map((key,index)=>key+'=$'+(index+1)).join(',')+' WHERE id=$'+(values.length+1)+' AND organization_id=$'+(values.length+2)+' RETURNING *',[...values,id,user.orgId]);
  await client.query('COMMIT');if(entity==='inventory')updated.rows[0].min_quantity=updated.rows[0].low_stock_threshold;return NextResponse.json({record:updated.rows[0]});
 }catch(error){if(transaction)await client.query('ROLLBACK');return apiError(error,'Unable to update the record');}finally{client.release();}
}
