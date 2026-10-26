import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor,hasAdminPermission } from '@/lib/admin-auth';
export async function GET(request:Request){
  const actor=await getAdminActor(request,'overview:read');if(!actor)return NextResponse.json({error:'Admin access required'},{status:403});
  try{const notifications:Array<{id:string;title:string;message:string;href:string;createdAt:string}>=[];
    if(hasAdminPermission(actor,'billing:read')){const failed=await query("SELECT id,event_type,created_at FROM billing_events WHERE status='failed' AND NOT EXISTS(SELECT 1 FROM organizations o WHERE o.id=billing_events.organization_id AND o.is_demo) ORDER BY created_at DESC LIMIT 5");for(const row of failed.rows)notifications.push({id:row.id,title:'Billing delivery needs attention',message:row.event_type,href:'/admin/billing?tab=webhooks&status=failed',createdAt:row.created_at});}
    if(hasAdminPermission(actor,'organizations:read')){const stale=await query("SELECT q.organization_id,o.name,MIN(q.created_at) AS created_at,COUNT(*)::int AS count FROM sync_queue q JOIN organizations o ON o.id=q.organization_id WHERE q.status IN ('pending','failed') AND NOT o.is_demo AND q.created_at<NOW()-INTERVAL '1 day' GROUP BY q.organization_id,o.name ORDER BY MIN(q.created_at) LIMIT 5");for(const row of stale.rows)notifications.push({id:'sync:'+row.organization_id,title:row.name+' has unsaved changes',message:row.count+' changes pending for more than a day',href:'/admin/organizations/'+row.organization_id+'?tab=usage',createdAt:row.created_at});}
    return NextResponse.json({notifications});
  }catch(error){console.error('Admin attention failed:',error);return NextResponse.json({error:'Unable to load operational attention items'},{status:500});}
}
