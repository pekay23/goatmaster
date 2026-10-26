'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Baby, CalendarDays, HeartPulse, Package, Plus, Scale } from 'lucide-react';
import { buttonClass, secondaryClass, date, ErrorNotice, number, records, requestApi, text } from '@/components/app/record-data';

const quickActions = [
  { href: '/herd/new', label: 'Add goat', icon: Plus },
  { href: '/health/new', label: 'Record treatment', icon: HeartPulse },
  { href: '/health/batch?kind=weight', label: 'Record weights', icon: Scale },
  { href: '/breeding/new', label: 'Record breeding', icon: Baby },
  { href: '/health/batch?kind=milk', label: 'Record milk', icon: Package },
  { href: '/events/new', label: 'Plan an event', icon: CalendarDays },
];

export default function DashboardPage() {
  const cache = useQueryClient();
  const stats = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => requestApi('/api/app/dashboard/stats'), refetchInterval: 60000 });
  const tasks = useQuery({ queryKey: ['farm-tasks'], queryFn: () => requestApi('/api/app/tasks'), refetchInterval: 60000 });
  const complete = useMutation({ mutationFn: (id: string) => requestApi('/api/app/events/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: true }) }), onSuccess: () => cache.invalidateQueries() });
  const taskRows = records(tasks.data?.tasks);
  const totals = [
    { label: 'Animals in your herd', value: stats.data?.totalGoats, href: '/herd' },
    { label: 'Active health alerts', value: stats.data?.activeAlerts, href: '/health' },
    { label: 'Events in the next week', value: stats.data?.upcomingEvents, href: '/events' },
    { label: 'Supplies running low', value: stats.data?.lowStockItems, href: '/inventory?filter=low_stock' },
  ];
  return <div className="mx-auto max-w-6xl space-y-7 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-green-800">Your farm notebook</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">Today on the farm</h1><p className="mt-2 text-slate-600">The animals, records, and supplies that need your attention.</p></div><Link className={secondaryClass} href="/herd">Open herd <ArrowUpRight size={18}/></Link></header>
    <section aria-label="Quick actions" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{quickActions.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-20 flex-col justify-center gap-2 rounded-xl border border-green-900/15 bg-white p-4 text-sm font-semibold text-green-900 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-800"><Icon size={20}/>{label}</Link>)}</section>
    {(stats.data?._offline === true || tasks.data?._offline === true) && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Offline. This is your last saved dashboard. Connect to check for new work.</p>}
    {stats.error && <ErrorNotice message={stats.error.message} retry={() => { void stats.refetch(); }}/>}<section aria-label="Farm overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{totals.map(total => <Link href={total.href} key={total.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">{total.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{stats.isLoading ? '…' : total.value == null ? '—' : number(total.value)}</p></Link>)}</section>
    <section aria-labelledby="tasks-title" className="space-y-4"><div className="flex items-center justify-between"><h2 id="tasks-title" className="text-xl font-semibold text-slate-900">Your work list</h2><Link href="/health/batch" className="text-sm font-semibold text-green-800 underline">Record for several animals</Link></div>{tasks.isLoading ? <p role="status">Loading farm tasks…</p> : tasks.error ? <ErrorNotice message={tasks.error.message} retry={() => { void tasks.refetch(); }}/> : taskRows.length === 0 ? <div className="rounded-2xl border border-dashed border-green-800/30 bg-green-50 p-8"><h3 className="font-semibold text-green-900">Nothing is due right now</h3><p className="mt-2 text-sm text-green-900/80">Add treatment dates, breeding records, and events to build your work list.</p><Link href="/events/new" className={buttonClass + ' mt-4'}>Plan the next task</Link></div> : <div className="grid gap-4 lg:grid-cols-3">{(['overdue', 'today', 'upcoming'] as const).map(bucket => { const items = taskRows.filter(task => task.bucket === bucket); return <section key={bucket} className={'rounded-2xl border p-4 ' + (bucket === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white')}><h3 className="flex items-center justify-between font-semibold capitalize text-slate-900">{bucket === 'upcoming' ? 'Next 7 days' : bucket}<span className="rounded-full bg-white/80 px-2 py-1 text-xs tabular-nums">{items.length}</span></h3><ul className="mt-3 divide-y divide-slate-200/70">{items.map(task => <li key={text(task.id)} className="py-3"><p className="font-medium text-slate-900">{text(task.title)}</p><p className="mt-1 text-xs text-slate-600">{date(task.due_at)}</p><div className="mt-3 flex flex-wrap gap-3"><Link className="min-h-11 py-2 text-sm font-semibold text-green-800 underline" href={text(task.href)}>{text(task.action)}</Link>{Boolean(task.event_id) && <button className="min-h-11 py-2 text-sm font-semibold text-slate-700 underline" disabled={complete.isPending} onClick={() => complete.mutate(text(task.event_id))}>Mark complete</button>}</div></li>)}{items.length === 0 && <li className="py-4 text-sm text-slate-500">No tasks in this group.</li>}</ul></section>; })}</div>}{complete.error && <ErrorNotice message={complete.error.message}/>}</section>
    <section aria-label="Farm measurements" className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Average weight change · last 30 days</p><p className="mt-2 text-2xl font-semibold">{stats.data?.avgWeightGain == null ? 'Not enough measurements' : number(stats.data.avgWeightGain).toFixed(2) + ' kg'}</p><p className="mt-2 text-xs text-slate-500">First to latest weight for animals with at least two measurements.</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Milk recorded · last 7 days</p><p className="mt-2 text-2xl font-semibold">{stats.data?.milkYield == null ? 'No milk records yet' : number(stats.data.milkYield).toFixed(2) + ' L'}</p><Link href="/milk" className="mt-2 inline-block text-sm text-green-800 underline">Open milk records</Link></div></section>
  </div>;
}
