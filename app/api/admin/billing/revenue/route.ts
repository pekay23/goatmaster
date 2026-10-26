import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminActor } from '@/lib/admin-auth';
export async function GET(request:Request){
 if(!await getAdminActor(request,'billing:read'))return NextResponse.json({error:'Billing access required'},{status:403});
 const includeDemo=new URL(request.url).searchParams.get('include_demo')==='true';
 try{const [mrr,failed,signups,revenue,cohorts,distribution]=await Promise.all([
 query("SELECT o.tier,COUNT(*)::int AS org_count,COALESCE(SUM(t.price_cents),0)::bigint AS mrr_cents FROM organizations o JOIN tiers t ON t.id=o.tier WHERE o.subscription_status='active' AND o.tier<>'free' AND ($1 OR NOT o.is_demo) GROUP BY o.tier ORDER BY mrr_cents DESC",[includeDemo]),
 query("SELECT COUNT(*)::int AS count FROM payments p WHERE p.status='failed' AND p.created_at>=NOW()-INTERVAL '7 days' AND ($1 OR NOT EXISTS(SELECT 1 FROM organizations o WHERE o.id=p.organization_id AND o.is_demo))",[includeDemo]),
 query("SELECT DATE(created_at)::text AS date,COUNT(*)::int AS count,COUNT(*) FILTER(WHERE tier<>'free')::int AS paid_count FROM organizations WHERE created_at>=NOW()-INTERVAL '30 days' AND ($1 OR NOT is_demo) GROUP BY DATE(created_at) ORDER BY date",[includeDemo]),
 query("SELECT DATE_TRUNC('month',p.created_at) AS month,SUM(p.amount)::bigint AS revenue_cents FROM payments p WHERE p.status='success' AND p.created_at>=NOW()-INTERVAL '12 months' AND ($1 OR NOT EXISTS(SELECT 1 FROM organizations o WHERE o.id=p.organization_id AND o.is_demo)) GROUP BY DATE_TRUNC('month',p.created_at) ORDER BY month",[includeDemo]),
 query("SELECT DATE_TRUNC('month',created_at) AS cohort_month,COUNT(*)::int AS total_orgs,COUNT(*) FILTER(WHERE subscription_status='active')::int AS active_orgs,COUNT(*) FILTER(WHERE tier<>'free')::int AS paid_orgs FROM organizations WHERE created_at>=NOW()-INTERVAL '12 months' AND ($1 OR NOT is_demo) GROUP BY DATE_TRUNC('month',created_at) ORDER BY cohort_month",[includeDemo]),
 query('SELECT tier,COUNT(*)::int AS count FROM organizations WHERE $1 OR NOT is_demo GROUP BY tier ORDER BY count DESC',[includeDemo]),
 ]);
 const byTier=mrr.rows.map((row:Record<string,unknown>)=>({tier:row.tier,orgCount:Number(row.org_count),mrrCents:Number(row.mrr_cents)}));
 const total=byTier.reduce((sum:number,row:{mrrCents:number})=>sum+row.mrrCents,0);
 return NextResponse.json({mrr:{total,activeSubs:byTier.reduce((sum:number,row:{orgCount:number})=>sum+row.orgCount,0),byTier},arr:{total:total*12},failedPayments7d:failed.rows[0].count,signupTrend:signups.rows.map((row:Record<string,unknown>)=>({date:row.date,total:row.count,paid:row.paid_count})),monthlyRevenue:revenue.rows.map((row:Record<string,unknown>)=>({month:row.month,revenueCents:Number(row.revenue_cents)})),cohorts:cohorts.rows.map((row:Record<string,unknown>)=>({cohortMonth:row.cohort_month,totalOrgs:row.total_orgs,activeOrgs:row.active_orgs,paidOrgs:row.paid_orgs,retentionRate:Number(row.total_orgs)>0?Number(row.active_orgs)/Number(row.total_orgs)*100:0})),tierDistribution:distribution.rows,includeDemo});
 }catch(error){console.error('Revenue reporting failed:',error);return NextResponse.json({error:'Unable to load revenue records'},{status:500});}
}
