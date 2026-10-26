import BillingDashboard from '@/components/admin/billing/BillingDashboard';
export default async function BillingPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;const read=(key:string)=>typeof params[key]==='string'?params[key]:'';
  return <BillingDashboard includeDemo={read('include_demo')==='true'} tab={read('tab')||'subscriptions'} search={read('search')} status={read('status')} tier={read('tier')} page={Math.max(1,Number.parseInt(read('page')||'1',10)||1)}/>;
}
