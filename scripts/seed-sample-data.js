import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getMigrationClient, runWithDbContext } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { generateReminders } from '../lib/reminders.js';
const destination = new URL('../.verification/sample-credentials.json',import.meta.url);
const previous = await readFile(destination,'utf8').then(JSON.parse).catch(()=>null);
const password = previous?.password || randomBytes(21).toString('base64url');
const id = label => { const h=createHash('sha256').update('goatmaster-sample:'+label).digest('hex'); return h.slice(0,8)+'-'+h.slice(8,12)+'-5'+h.slice(13,16)+'-8'+h.slice(17,20)+'-'+h.slice(20,32); };
const date = days => new Date(Date.now()+days*86400000).toISOString();
const fixtures={password,farms:[],platform:{}};
await runWithDbContext({role:'service'},async()=>{
  const client=await getMigrationClient();
  const save=async(table,record)=>{ const keys=Object.keys(record); const result=await client.query('INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map((_,i)=>'$'+(i+1)).join(',')+') ON CONFLICT (id) DO UPDATE SET '+keys.filter(k=>k!=='id').map(k=>k+'=EXCLUDED.'+k).join(',')+' RETURNING *',Object.values(record));return result.rows[0]; };
  const account=async(label,role,orgId)=>{const email=label+'@sample.goatmaster.invalid';const record=await save('users',{id:id(label),email,username:'Sample '+label,is_demo:true,password_hash:await hashPassword(password),role,organization_id:orgId,tier:'free'});if(orgId)await client.query("INSERT INTO organization_members(organization_id,user_id,role,status) VALUES($1,$2,$3,'active') ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,status='active'",[orgId,record.id,label.endsWith('.owner')?'owner':'member']);return {email,password,userId:record.id};};
  try{
    await client.query('BEGIN');
    for(const [slug,name,tier,count] of [['meadow','Sample Meadow Farm','free',4],['ridge','Sample Ridge Farm','basic',6],['river','Sample River Farm','pro',8]]){
      const orgId=id('org:'+slug);const existing=await client.query('SELECT is_demo FROM organizations WHERE id=$1 OR slug=$2',[orgId,'sample-'+slug]);if(existing.rows.some(o=>!o.is_demo))throw new Error('A non-sample organization conflicts with a fixture key');
      await save('organizations',{id:orgId,name,slug:'sample-'+slug,tier,is_demo:true,subscription_status:tier==='free'?'inactive':'active',current_period_end:date(20),manual_override:false});
      const owner=await account(slug+'.owner','user',orgId);const member=await account(slug+'.member','user',orgId);const goatIds=[];
      const names=['Ama','Kofi','Akua','Kojo','Esi','Kwame','Abena','Yaw'];
      for(let n=0;n<count;n++){const goatId=id(slug+':goat:'+n);goatIds.push(goatId);await save('goats',{id:goatId,owner_id:owner.userId,organization_id:orgId,name:names[n],breed:n%2?'West African Dwarf':'Sahelian',sex:n%2?'male':'female',ear_tag:slug.toUpperCase().slice(0,3)+'-'+String(n+1).padStart(3,'0'),dob:date(-600-n*40),status:n===0?'pregnant':n===3?'for_sale':'active',image_url:null,deleted_at:null});}
      const base={owner_id:owner.userId,organization_id:orgId,deleted_at:null};
      await save('health_records',{...base,id:id(slug+':health:old'),goat_id:goatIds[0],type:'vaccination',treatment:'Sample historical vaccination',cost:15,record_date:date(-60),next_due_date:date(-30)});
      await save('health_records',{...base,id:id(slug+':health:due'),goat_id:goatIds[0],type:'vaccination',treatment:'Sample vaccination follow-up',cost:20,record_date:date(-14),next_due_date:date(-1),notes:'Sample record for workflow verification. Not medical guidance.'});
      await save('health_records',{...base,id:id(slug+':health:upcoming'),goat_id:goatIds[2],type:'deworming',treatment:'Sample planned treatment',cost:12,record_date:date(-7),next_due_date:date(3)});
      await save('breeding_records',{...base,id:id(slug+':breeding'),dam_id:goatIds[0],sire_id:goatIds[1],status:'confirmed',mating_date:date(-145),expected_kidding_date:date(4),kids_count:0,notes:'Sample breeding record'});
      const inventoryId=id(slug+':inventory');await save('inventory',{...base,id:inventoryId,name:'Sample mineral feed',category:'feed',quantity:3,unit:'kg',low_stock_threshold:5,unit_price:9,supplier:'Sample supplier'});
      await save('inventory',{...base,id:id(slug+':inventory:full'),name:'Sample bedding',category:'bedding',quantity:25,unit:'bag',low_stock_threshold:5,unit_price:12,supplier:'Sample supplier'});
      for(const day of [-21,-7,0]){await save('weight_records',{...base,id:id(slug+':weight:'+day),goat_id:goatIds[0],weight_kg:28+(day+21)/7,record_date:date(day),notes:'Sample measurement'});await save('milk_records',{...base,id:id(slug+':milk:'+day),goat_id:goatIds[2],morning_yield:1.2,evening_yield:0.8,record_date:date(day),notes:'Sample yield'});}
      const eventIds=[];for(const [label,days,category,completed] of [['Herd check',0,'Health',false],['Fence inspection',-2,'Maintenance',false],['Feed delivery',3,'Inventory',false],['Completed herd review',-4,'General',true]]){const eventId=id(slug+':event:'+label);eventIds.push(eventId);await save('farm_events',{...base,id:eventId,subject:'Sample '+label,details:'Sample farm work for end-to-end verification',event_date:date(days),category,keywords:JSON.stringify(['sample']),completed_at:completed?date(-3):null});await save('farm_event_goats',{...base,id:id(slug+':event-link:'+label),event_id:eventId,goat_id:goatIds[0]});}
      await save('usage_logs',{...base,id:id(slug+':usage'),inventory_item_id:inventoryId,item_name:'Sample mineral feed',quantity_used:2,unit:'kg',notes:'Sample consumption'});
      await save('expenditures',{...base,id:id(slug+':expense'),inventory_item_id:inventoryId,amount:45,category:'feed',description:'Sample feed purchase'});
      await save('sales',{...base,id:id(slug+':sale'),customer:'Sample buyer',amount:320,contact_info:'sample@example.invalid',items_data:JSON.stringify([{name:'Sample farm produce',quantity:2}]),sale_date:date(-3)});
      await save('corrections',{...base,id:id(slug+':correction'),correction_type:'identity_review',source_goat_id:goatIds[0],target_goat_id:goatIds[2],notes:'Sample review case',status:'pending'});
      for(const [index,status] of [['paid','success'],['failed','failed']])await save('payments',{id:id(slug+':payment:'+index),organization_id:orgId,reference:'sample-'+slug+'-'+index,email:owner.email,amount:tier==='free'?0:tier==='basic'?999:2999,tier,status,paystack_data:JSON.stringify({sample:true}),created_at:date(-3)});
      await save('billing_events',{id:id(slug+':webhook'),organization_id:orgId,event_id:'sample:'+slug+':webhook',event_type:'sample.delivery',status:'failed',error_message:'Sample failed delivery for retry UI verification',payload:JSON.stringify({event:'sample.delivery',data:{metadata:{organizationId:orgId},sample:true}})});
      await save('scan_history',{id:id(slug+':scan'),organization_id:orgId,goat_id:null,goat_name:null,confidence:0,detected:false,method:'sample-no-match'});
      await save('audit_logs',{id:id(slug+':audit'),organization_id:orgId,actor_id:owner.userId,actor_email:owner.email,actor_role:'user',action:'sample.seeded',resource:'organization',resource_id:orgId,after_state:JSON.stringify({sample:true,tier})});
      fixtures.farms.push({slug:'sample-'+slug,name,tier,orgId,owner,member,goatIds,inventoryId,eventIds});
    }
    fixtures.platform.admin=await account('platform.admin','super_admin',null);fixtures.platform.support=await account('platform.support','support',null);fixtures.platform.billing=await account('platform.billing','billing',null);
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
});
await generateReminders();
await mkdir(new URL('../.verification/',import.meta.url),{recursive:true});await writeFile(destination,JSON.stringify(fixtures,null,2));
console.log('Seeded '+fixtures.farms.length+' clearly labeled sample farms and platform test accounts. Credentials saved to ignored .verification/sample-credentials.json.');
process.exit(0);
