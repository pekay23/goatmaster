'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { recordConfiguration } from './RecordForm';
import { useTier } from '@/lib/context/TierContext';
import { buttonClass, secondaryClass, date, ErrorNotice, inputClass, number, object, records, requestApi, text, DataRecord } from './record-data';

export type ListSection = 'herd' | 'health' | 'breeding' | 'inventory' | 'events' | 'weights' | 'milk';
const configuration: Record<ListSection, { title: string; description: string; endpoint: string; key: string; filters: Array<{ key: string; label: string; options: string[] }>; columns: Array<[string, string]> }> = {
  herd: { title: 'Your herd', description: 'Find an animal, open its history, or add the next record.', endpoint: 'goats', key: 'goats', filters: [{ key: 'sex', label: 'Sex', options: ['female', 'male', 'unknown'] }, { key: 'status', label: 'Status', options: ['active', 'pregnant', 'for_sale', 'sold', 'deceased'] }], columns: [['breed', 'Breed'], ['sex', 'Sex'], ['status', 'Status'], ['ear_tag', 'Ear tag']] },
  health: { title: 'Health records', description: 'Treatments, vaccinations, and the dates that matter next.', endpoint: 'health', key: 'records', filters: [{ key: 'type', label: 'Type', options: ['vaccination', 'deworming', 'treatment', 'checkup', 'injury', 'illness', 'supplement', 'other'] }], columns: [['type', 'Type'], ['treatment', 'Treatment'], ['record_date', 'Recorded'], ['next_due_date', 'Next due']] },
  breeding: { title: 'Breeding records', description: 'Follow mating, pregnancy, and kidding.', endpoint: 'breeding', key: 'records', filters: [{ key: 'status', label: 'Status', options: ['planned', 'mated', 'confirmed', 'kidded', 'failed'] }], columns: [['sire_name', 'Sire'], ['status', 'Status'], ['expected_kidding_date', 'Expected kidding'], ['kids_count', 'Kids']] },
  inventory: { title: 'Farm supplies', description: 'Feed, medicine, and equipment with current stock levels.', endpoint: 'inventory', key: 'items', filters: [{ key: 'category', label: 'Category', options: ['feed', 'medicine', 'supplement', 'equipment', 'bedding', 'fencing', 'other'] }, { key: 'filter', label: 'Stock', options: ['low_stock'] }], columns: [['category', 'Category'], ['quantity', 'Quantity'], ['min_quantity', 'Minimum'], ['unit_price', 'Unit price (GHS)']] },
  events: { title: 'Farm events', description: 'Plan visits, jobs, and important dates for your farm.', endpoint: 'events', key: 'records', filters: [{ key: 'filter', label: 'Show', options: ['upcoming'] }], columns: [['category', 'Category'], ['event_date', 'Date'], ['completed_at', 'Completed']] },
  weights: { title: 'Weight records', description: 'Track measurements for individual animals over time.', endpoint: 'weights', key: 'records', filters: [], columns: [['weight_kg', 'Weight (kg)'], ['record_date', 'Recorded'], ['notes', 'Notes']] },
  milk: { title: 'Milk records', description: 'Keep morning and evening yields together.', endpoint: 'milk', key: 'records', filters: [], columns: [['morning_yield', 'Morning (L)'], ['evening_yield', 'Evening (L)'], ['record_date', 'Recorded']] },
};

function label(value: string) { return value.replaceAll('_', ' ').replace(/^./, first => first.toUpperCase()); }
function cell(row: DataRecord, key: string) {
  if (key.endsWith('_date') || key === 'completed_at') return row[key] ? date(row[key]) : 'Not recorded';
  if (key === 'unit_price') return number(row[key]).toFixed(2);
  return text(row[key], 'Not recorded').replaceAll('_', ' ');
}

export default function RecordList({ section }: { section: ListSection }) {
  const config = configuration[section];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cache = useQueryClient();
  const { features, isLoading: planLoading } = useTier();
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState({ url: urlSearch, value: urlSearch });
  if (search.url !== urlSearch) setSearch({ url: urlSearch, value: urlSearch });
  const queryString = searchParams.toString();
  useEffect(() => {
    if (search.value === urlSearch) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(queryString);
      if (search.value) params.set('search', search.value); else params.delete('search');
      params.delete('page');
      window.history.replaceState(null,'',pathname + (params.size ? '?' + params.toString() : ''));
    }, 300);
    return () => clearTimeout(timer);
  }, [search.value, urlSearch, queryString, pathname]);
  const listing = useQuery({ queryKey: ['record-list', section, queryString], queryFn: () => requestApi('/api/app/' + config.endpoint + '?' + queryString) });
  const remove = useMutation({ mutationFn: async (id: string) => { const row = records(listing.data?.[config.key]).find(item=>item.id===id); if(!navigator.onLine){ const pending={...row,id,deleted_at:new Date().toISOString()}; await queueSyncAction(recordConfiguration[section].table,'DELETE',pending);const db=await initDb();await db.put(recordConfiguration[section].table,pending);return; } return requestApi('/api/app/' + config.endpoint + '/' + id, { method: 'DELETE',headers:typeof row?.version==='number'?{'If-Match':String(row.version)}:{} }); }, onSuccess: () => cache.invalidateQueries() });
  const rows = records(listing.data?.[config.key]);
  const stats = object(listing.data?.stats);
  const maxGoats = features?.maxGoats ?? 0;
  const limitReached = section === 'herd' && !planLoading && maxGoats >= 0 && number(stats.total) >= maxGoats;
  const page = number(listing.data?.page) || 1;
  const totalPages = number(listing.data?.totalPages) || 1;
  const returnTo = pathname + (queryString ? '?' + queryString : '');
  const detailLink = (id: string, edit = false) => pathname + '/' + id + (edit ? '/edit' : '') + '?returnTo=' + encodeURIComponent(returnTo);
  function update(key: string, value: string) { const params = new URLSearchParams(queryString); if (value) params.set(key, value); else params.delete(key); if (key !== 'page') params.delete('page'); window.history.replaceState(null,'',pathname + (params.size ? '?' + params.toString() : '')); }
  const metrics = section === 'herd' ? [['total', 'All animals'], ['active', 'Active'], ['pregnant', 'Pregnant'], ['for_sale', 'For sale']]
    : section === 'breeding' ? [['planned', 'Planned'], ['confirmed', 'Confirmed'], ['kidded', 'Kids born · 30 days'], ['due_month', 'Due this month']]
    : section === 'inventory' ? [['total', 'Items'], ['low_stock', 'Low stock'], ['value', 'Stock value · GHS'], ['categories', 'Categories']] : [];
  return <div className="mx-auto max-w-6xl space-y-6 pb-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-green-800">Your farm notebook</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{config.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{config.description}</p></div><div className="flex flex-wrap gap-2">{['health', 'weights', 'milk'].includes(section) && <Link className={secondaryClass} href={'/health/batch?kind=' + (section === 'weights' ? 'weight' : section === 'milk' ? 'milk' : 'health')}>Record several animals</Link>}{!limitReached && <Link href={pathname + '/new'} className={buttonClass}><Plus size={18}/>{section === 'herd' ? 'Add goat' : section === 'inventory' ? 'Add item' : section === 'events' ? 'Plan event' : 'Add record'}</Link>}</div></header>
    {limitReached && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your plan includes {maxGoats} animals. <Link className="font-semibold underline" href="/settings#billing">View plan options</Link></p>}
    {listing.data?._offline === true && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Offline. Showing records saved on this device; this may be part of your herd.</p>}
    {listing.data?._offline !== true && metrics.length > 0 && <section aria-label="Organization totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([key, title]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-600">{title}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{listing.isLoading ? '…' : key === 'value' ? number(stats[key]).toFixed(2) : number(stats[key])}</p></div>)}</section>}
    <section aria-label="Search and filters" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><label className="min-w-48 flex-1 text-sm font-medium"><span className="inline-flex items-center gap-2"><Search size={16}/>Search records</span><input className={inputClass} value={search.value} onChange={event => setSearch({ url: urlSearch, value: event.target.value })} placeholder={section === 'herd' ? 'Name, ear tag, or breed' : 'Search this section'}/></label>{config.filters.map(filter => <label key={filter.key} className="text-sm font-medium">{filter.label}<select value={searchParams.get(filter.key) || ''} className={inputClass} onChange={event => update(filter.key, event.target.value)}><option value="">All</option>{filter.options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></label>)}{(section === 'herd' || section === 'inventory') && <label className="text-sm font-medium">Sort<select className={inputClass} value={searchParams.get('sort') || ''} onChange={event => update('sort', event.target.value)}><option value="">Newest first</option><option value="name">Name A to Z</option></select></label>}</section>
    {remove.error && <ErrorNotice message={remove.error.message}/>}<section aria-label={config.title} className="rounded-2xl border border-slate-200 bg-white">{listing.isLoading ? <p role="status" className="p-6">Loading records…</p> : listing.error ? <div className="p-4"><ErrorNotice message={listing.error.message} retry={() => { void listing.refetch(); }}/></div> : rows.length === 0 ? <div className="p-8"><h2 className="font-semibold text-slate-900">{queryString ? 'No matching records' : 'Your first record starts here'}</h2><p className="mt-2 text-sm text-slate-600">{queryString ? 'Try another search or clear your filters.' : 'Add a record to begin building your farm history.'}</p></div> : <>
      <div className="divide-y divide-slate-200 md:hidden">{rows.map(row => <article key={text(row.id)} className="space-y-3 p-4"><Link href={detailLink(text(row.id))} className="font-semibold text-green-900 underline underline-offset-4">{text(row.name ?? row.goat_name ?? row.dam_name ?? row.subject, 'Record')}</Link><dl className="grid grid-cols-2 gap-3 text-sm">{config.columns.map(([key, title]) => <div key={key}><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 break-words text-slate-900">{cell(row, key)}</dd></div>)}</dl><div className="flex gap-3"><Link className={secondaryClass} href={detailLink(text(row.id), true)}>Edit</Link><button className="min-h-11 px-3 text-sm text-red-800 underline" disabled={remove.isPending} onClick={() => { if (confirm('Delete this record?')) remove.mutate(text(row.id)); }}>Delete</button></div></article>)}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><caption className="sr-only">{config.title}</caption><thead><tr className="border-b border-slate-200 text-left text-slate-500"><th scope="col" className="px-4 py-3">{section === 'herd' ? 'Animal' : section === 'inventory' ? 'Item' : section === 'events' ? 'Event' : 'Animal'}</th>{config.columns.map(([key, title]) => <th key={key} scope="col" className="px-4 py-3">{title}</th>)}<th scope="col" className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={text(row.id)} className="hover:bg-green-50/40"><th scope="row" className="px-4 py-4 text-left font-semibold"><Link href={detailLink(text(row.id))} className="text-green-900 underline underline-offset-4">{text(row.name ?? row.goat_name ?? row.dam_name ?? row.subject, 'Record')}</Link></th>{config.columns.map(([key]) => <td key={key} className="px-4 py-4 text-slate-700">{cell(row, key)}</td>)}<td className="px-4 py-3"><div className="flex gap-3"><Link className="min-h-11 py-2 text-green-800 underline" href={detailLink(text(row.id), true)}>Edit</Link><button className="min-h-11 py-2 text-red-800 underline" disabled={remove.isPending} onClick={() => { if (confirm('Delete this record?')) remove.mutate(text(row.id)); }}>Delete</button></div></td></tr>)}</tbody></table></div>
    </>}</section><nav aria-label="Record pages" className="flex flex-wrap items-center justify-between gap-4"><p role="status" className="text-sm text-slate-600">{number(listing.data?.total)} matching records · Page {page} of {totalPages}</p><div className="flex gap-2"><button className={secondaryClass} disabled={page <= 1 || listing.isFetching} onClick={() => update('page', String(page - 1))}>Previous</button><button className={secondaryClass} disabled={page >= totalPages || listing.isFetching} onClick={() => update('page', String(page + 1))}>Next</button></div></nav>
  </div>;
}
