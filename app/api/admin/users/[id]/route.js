import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function changeUser(request,params,remove){
 const actor=await getAdminActor(request,'users:write');if(!actor)return NextResponse.json({error:'Permission denied'},{status:403});
 const {id}=await params;if(!uuid.test(id))return NextResponse.json({error:'Invalid user ID'},{status:400});
 const body=remove?{}:await request.json();
 if(!remove&&body.subscription_tier!==undefined)return NextResponse.json({error:'Plans belong to organizations. Change the organization plan with an override reason.'},{status:400});
 if(!remove&&(!['user','admin','super_admin','support','billing'].includes(body.role)||actor.role!=='super_admin'))return NextResponse.json({error:'Only a super admin can assign a valid platform role'},{status:403});
 if(id===actor.sub)return NextResponse.json({error:'Ask another administrator to change your account'},{status:403});
 const client=await getClient();
 try{
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(194671282)');
  const result=await client.query('SELECT id,email,username,role,tier,organization_id,is_demo FROM users WHERE id=$1 FOR UPDATE',[id]);const target=result.rows[0];
  if(!target){await client.query('ROLLBACK');return NextResponse.json({error:'User not found'},{status:404});}
  if(target.role!=='user'&&actor.role!=='super_admin'){await client.query('ROLLBACK');return NextResponse.json({error:'Only a super admin can change administrator accounts'},{status:403});}
  const nextRole=remove?null:body.role;
  if(target.role==='super_admin'&&nextRole!=='super_admin'){const count=await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role='super_admin' AND is_demo=$1",[target.is_demo]);if(count.rows[0].count<=1){await client.query('ROLLBACK');return NextResponse.json({error:'Cannot remove the last super admin'},{status:409});}}
  if(['admin','super_admin'].includes(target.role)&&!['admin','super_admin'].includes(nextRole)){const count=await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role IN ('admin','super_admin') AND is_demo=$1",[target.is_demo]);if(count.rows[0].count<=1){await client.query('ROLLBACK');return NextResponse.json({error:'Cannot remove the last administrator'},{status:409});}}
  if(remove){const ownership=await client.query("SELECT id FROM organization_members WHERE user_id=$1 AND role='owner' AND status='active'",[id]);if(ownership.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Transfer organization ownership before deleting this account'},{status:409});}}
  const updated=remove?await client.query('DELETE FROM users WHERE id=$1 RETURNING id',[id]):await client.query('UPDATE users SET role=$1,auth_version=auth_version+1 WHERE id=$2 RETURNING id,email,username,role,tier,organization_id',[nextRole,id]);
  await client.query('INSERT INTO audit_logs(actor_id,actor_email,actor_role,action,resource,resource_id,organization_id,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[actor.sub,actor.email,actor.role,remove?'user.deleted':'user.role_changed','user',id,target.organization_id,JSON.stringify(target),JSON.stringify(remove?{}:updated.rows[0])]);
  await client.query('COMMIT');return NextResponse.json(remove?{success:true}:updated.rows[0]);
 }catch(error){await client.query('ROLLBACK');console.error('Account update failed:',error);return NextResponse.json({error:'Unable to update account'},{status:500});}finally{client.release();}
}
export async function PATCH(request,{params}){return changeUser(request,params,false);}
export async function DELETE(request,{params}){return changeUser(request,params,true);}
