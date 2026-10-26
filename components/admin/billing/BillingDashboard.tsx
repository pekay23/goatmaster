'use client';
import Link from 'next/link';
import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { adminRequest,number,records } from '../contracts';
import SubscriptionTable from './SubscriptionTable';
import WebhookTable from './WebhookTable';
import RecoveryPanel from './RecoveryPanel';
import RevenuePanel from './RevenuePanel';
type Filters={includeDemo:boolean;tab:string;search:string;status:string;tier:string;page:number};
const tabs=['subscriptions','webhooks','churn','revenue'];
export default function BillingDashboard(filters:Filters) {
  const router=useRouter();const queryClient=useQueryClient();const active=tabs.includes(filters.tab)?filters.tab:'subscriptions';
  function url(overrides:Partial<Filters>={}){const params=new URLSearchParams();for(const [key,value]of Object.entries({...filters,...overrides}))if(value!==''&&!(key==='page'&&value===1))params.set(key==='includeDemo'?'include_demo':key,String(value));return '/admin/billing?'+params;}
  const apiParams=new URLSearchParams({page:String(filters.page),search:filters.search,status:filters.status,tier:filters.tier,limit:'25',include_demo:String(filters.includeDemo)});
  const session=useQuery({queryKey:['admin-session'],queryFn:()=>adminRequest('/api/admin/auth/me')});
  const canWrite=Array.isArray(session.data?.permissions)&&session.data.permissions.includes('billing:write');
  const subscriptions=useQuery({queryKey:['admin-billing',filters],queryFn:()=>adminRequest('/api/admin/billing?'+apiParams),enabled:active==='subscriptions'});
  const webhooks=useQuery({queryKey:['admin-billing-webhooks',filters],queryFn:()=>adminRequest('/api/admin/billing/webhooks?'+apiParams),enabled:active==='webhooks'});
  const recovery=useQuery({queryKey:['admin-churn',filters.includeDemo],queryFn:()=>adminRequest('/api/admin/billing/churn?include_demo='+filters.includeDemo),enabled:active==='churn'});
  const revenue=useQuery({queryKey:['admin-revenue',filters.includeDemo],queryFn:()=>adminRequest('/api/admin/billing/revenue?include_demo='+filters.includeDemo),enabled:active==='revenue'});
  const current=active==='subscriptions'?subscriptions:active==='webhooks'?webhooks:active==='churn'?recovery:revenue;
  const totalPages=Math.max(1,number(current.data?.totalPages));
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);router.push(url({search:String(form.get('search')||''),status:String(form.get('status')||''),tier:String(form.get('tier')||''),page:1}));}
  return <div className="gm-admin-workspace"><header className="gm-admin-heading"><div><p className="gm-admin-eyebrow">Billing operations</p><h1>Subscriptions and payments</h1><p>Review account status, delivery failures, and recorded revenue.</p></div><button className="gm-admin-button" onClick={()=>void queryClient.invalidateQueries({predicate:query=>String(query.queryKey[0]).startsWith('admin-')})} disabled={current.isFetching}>{current.isFetching?'Refreshing…':'Refresh billing'}</button></header><p className="gm-admin-muted">{filters.includeDemo?'Including clearly labeled sample farm records.':'Sample farm records are excluded.'} <Link className="gm-admin-inline-action" href={url({includeDemo:!filters.includeDemo,page:1})}>{filters.includeDemo?'Hide sample farms':'Include sample farms'}</Link></p><nav className="gm-admin-tabs" aria-label="Billing sections">{tabs.map(tab=><Link key={tab} className={active===tab?'gm-admin-tab-active':''} href={url({tab,page:1,status:'',search:'',tier:''})} aria-current={active===tab?'page':undefined}>{tab==='churn'?'Account recovery':tab==='webhooks'?'Billing deliveries':tab.replaceAll('_',' ')}</Link>)}</nav>
  {(active==='subscriptions'||active==='webhooks')&&<section className="gm-admin-panel"><form key={JSON.stringify(filters)} className="gm-admin-filters" onSubmit={submit}>{active==='subscriptions'&&<><label className="gm-admin-search">Find account<input name="search" defaultValue={filters.search} placeholder="Organization, slug, or owner email"/></label><label>Plan<select name="tier" defaultValue={filters.tier}><option value="">All plans</option>{['free','basic','pro','enterprise'].map(tier=><option key={tier} value={tier}>{tier}</option>)}</select></label></>}<label>Status<select name="status" defaultValue={filters.status}><option value="">All statuses</option>{(active==='subscriptions'?['inactive','active','past_due','cancelled','trialing']:['pending','processed','failed']).map(value=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></label><button type="submit" className="gm-admin-button">Apply filters</button></form></section>}
  {current.isPending?<div className="gm-admin-loading" role="status">Loading billing records…</div>:current.error?<div className="gm-admin-error" role="alert">{current.error.message}<button onClick={()=>void current.refetch()}>Try again</button></div>:current.data&&<>{active==='subscriptions'&&<section className="gm-admin-panel"><SubscriptionTable rows={records(current.data.subscriptions)}/></section>}{active==='webhooks'&&<section className="gm-admin-panel"><WebhookTable rows={records(current.data.webhooks)} canWrite={canWrite}/></section>}{active==='churn'&&<RecoveryPanel organizations={records(current.data.atRiskOrgs)} offers={records(current.data.retentionOffers)} canWrite={canWrite}/>} {active==='revenue'&&<RevenuePanel data={current.data}/>}</>}
  {(active==='subscriptions'||active==='webhooks')&&current.data&&<nav className="gm-admin-pagination" aria-label="Billing result pages">{filters.page>1?<Link href={url({page:filters.page-1})}>Previous</Link>:<span aria-disabled="true">Previous</span>}<span>{number(current.data.total)} records · Page {filters.page} of {totalPages}</span>{filters.page<totalPages?<Link href={url({page:filters.page+1})}>Next</Link>:<span aria-disabled="true">Next</span>}</nav>}</div>;
}
