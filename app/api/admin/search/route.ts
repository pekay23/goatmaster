import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor,hasAdminPermission } from '@/lib/admin-auth';
export async function GET(request:Request){
  const actor=await getAdminActor(request,'overview:read');if(!actor)return NextResponse.json({error:'Admin access required'},{status:403});
  const search=new URL(request.url).searchParams.get('q')?.trim().slice(0,200)||'';if(search.length<2)return NextResponse.json({results:[]});
  try{const results:Array<{id:string;title:string;detail:string;href:string;kind:string}>=[];
    if(hasAdminPermission(actor,'organizations:read')){const orgs=await query("SELECT id,name,slug FROM organizations WHERE name ILIKE $1 OR slug ILIKE $1 ORDER BY name LIMIT 8",['%'+search+'%']);for(const row of orgs.rows)results.push({id:'organization:'+row.id,title:row.name,detail:row.slug,href:'/admin/organizations/'+row.id,kind:'Organization'});}
    if(hasAdminPermission(actor,'users:read')){const users=await query("SELECT id,username,email FROM users WHERE username ILIKE $1 OR email ILIKE $1 ORDER BY username LIMIT 8",['%'+search+'%']);for(const row of users.rows)results.push({id:'user:'+row.id,title:row.username,detail:row.email,href:'/admin/users?search='+encodeURIComponent(row.email),kind:'User'});}
    return NextResponse.json({results});
  }catch(error){console.error('Admin search failed:',error);return NextResponse.json({error:'Unable to search accounts'},{status:500});}
}
