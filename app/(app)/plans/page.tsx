import Link from 'next/link';
import PlanComparison from '@/components/app/PlanComparison';

export default async function PlansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const selectedPlan = typeof params.select === 'string' ? params.select : null;
  return <div className="mx-auto max-w-6xl pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-green-800">Your farm account</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">Compare plans</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">See current prices and limits, then choose what fits your herd.</p></div>
      <Link href="/settings#billing" className="min-h-11 content-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white">Billing settings</Link>
    </header>
    <PlanComparison selectedPlan={selectedPlan} />
  </div>;
}
