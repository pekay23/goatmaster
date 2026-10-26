'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SmartImage from '@/components/SmartImage';
import { initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { recordConfiguration } from './RecordForm';
import type { RecordSection } from './record-schema';
import { buttonClass, secondaryClass, date, ErrorNotice, object, records, requestApi, text } from './record-data';

const detailFields: Record<RecordSection, Array<[string, string]>> = {
  herd: [['ear_tag', 'Ear tag'], ['breed', 'Breed'], ['sex', 'Sex'], ['dob', 'Date of birth'], ['status', 'Status'], ['dam_name', 'Dam'], ['sire_name', 'Sire']],
  health: [['goat_name', 'Goat'], ['type', 'Record type'], ['record_date', 'Recorded'], ['next_due_date', 'Next due'], ['treatment', 'Treatment'], ['cost', 'Cost (GHS)'], ['notes', 'Notes']],
  breeding: [['dam_name', 'Dam'], ['sire_name', 'Sire'], ['status', 'Status'], ['mating_date', 'Mating date'], ['expected_kidding_date', 'Expected kidding'], ['actual_kidding_date', 'Kidding date'], ['kids_count', 'Kids'], ['notes', 'Notes']],
  inventory: [['name', 'Item'], ['category', 'Category'], ['quantity', 'Quantity'], ['unit', 'Unit'], ['min_quantity', 'Low stock threshold'], ['unit_price', 'Unit price (GHS)'], ['supplier', 'Supplier']],
  events: [['category', 'Category'], ['event_date', 'Event date'], ['completed_at', 'Completed'], ['details', 'Details']],
  weights: [['goat_name', 'Goat'], ['weight_kg', 'Weight (kg)'], ['record_date', 'Recorded'], ['notes', 'Notes']],
  milk: [['goat_name', 'Goat'], ['morning_yield', 'Morning yield (L)'], ['evening_yield', 'Evening yield (L)'], ['record_date', 'Recorded'], ['notes', 'Notes']],
};

export default function RecordDetails({ section, recordId, returnTo }: { section: RecordSection; recordId: string; returnTo?: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const config = recordConfiguration[section];
  const destination = returnTo?.startsWith('/' + section + '?') || returnTo === '/' + section ? returnTo : '/' + section;
  const endpoint = '/api/app/' + config.endpoint + '/' + recordId;
  const recordQuery = useQuery({ queryKey: ['record-detail', section, recordId], queryFn: () => requestApi(endpoint + (section === 'herd' ? '/timeline' : '')) });
  const item = object(recordQuery.data?.record ?? recordQuery.data?.item ?? recordQuery.data?.goat ?? recordQuery.data);
  const history = records(recordQuery.data?.timeline);
  const remove = useMutation({ mutationFn: async () => {
    if (!navigator.onLine) {
      const pending = { ...item, id: recordId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await queueSyncAction(config.table, 'DELETE', pending);
      const db = await initDb(); await db.put(config.table, pending); return;
    }
    return requestApi(endpoint, { method: 'DELETE', headers: typeof item.version === 'number' ? { 'If-Match': String(item.version) } : {} });
  }, onSuccess: async () => { await cache.invalidateQueries(); router.push(destination); } });
  const complete = useMutation({ mutationFn: () => requestApi(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !item.completed_at, version: item.version }) }), onSuccess: () => cache.invalidateQueries() });
  const title = text(item.name ?? item.subject ?? item.goat_name ?? item.dam_name, config.title);
  return <div className="mx-auto max-w-4xl space-y-6 py-4"><Link href={destination} className="inline-flex min-h-11 items-center text-sm text-green-800 underline">Back to {section}</Link>{recordQuery.isLoading ? <p role="status">Loading record…</p> : recordQuery.error ? <ErrorNotice message={recordQuery.error.message} retry={() => { void recordQuery.refetch(); }}/> : <>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-green-800">{config.title}</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{title}</h1>{section === 'herd' && <p className="mt-2 text-sm text-slate-600">{text(item.ear_tag, 'No ear tag recorded')} · {text(item.breed, 'Breed not recorded')}</p>}</div><Link href={'/' + section + '/' + recordId + '/edit?returnTo=' + encodeURIComponent(destination)} className={secondaryClass}>Edit record</Link></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">{section === 'herd' && Boolean(item.image_url) && <SmartImage src={text(item.image_url)} alt={title} className="mb-6 h-48 w-48 rounded-xl object-cover"/>}<dl className="grid gap-4 sm:grid-cols-2">{detailFields[section].map(([key, label]) => <div key={key} className={'border-b border-slate-100 pb-3 ' + (key === 'notes' || key === 'details' ? 'sm:col-span-2' : '')}><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{item[key] == null || item[key] === '' ? 'Not recorded' : key.endsWith('_date') || key === 'dob' || key === 'completed_at' ? date(item[key]) : text(item[key]).replaceAll('_', ' ')}</dd></div>)}</dl>{['health', 'weights', 'milk'].includes(section) && Boolean(item.goat_id) && <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-green-800 underline" href={'/herd/' + text(item.goat_id)}>Open animal history</Link>}{section === 'breeding' && <div className="mt-4 flex gap-4"><Link className="min-h-11 py-2 text-sm text-green-800 underline" href={'/herd/' + text(item.dam_id)}>Open dam</Link>{Boolean(item.sire_id) && <Link className="min-h-11 py-2 text-sm text-green-800 underline" href={'/herd/' + text(item.sire_id)}>Open sire</Link>}</div>}{section === 'events' && <button type="button" className={secondaryClass + ' mt-5'} disabled={complete.isPending} onClick={() => complete.mutate()}>{item.completed_at ? 'Reopen event' : 'Mark complete'}</button>}{complete.error && <ErrorNotice message={complete.error.message}/>}</section>
    {section === 'herd' && <><section aria-label="Record the next action" className="flex flex-wrap gap-2"><Link className={buttonClass} href={'/health/new?goatId=' + recordId}>Record treatment</Link><Link className={secondaryClass} href={'/weights/new?goatId=' + recordId}>Record weight</Link>{item.sex === 'female' && <Link className={secondaryClass} href={'/milk/new?goatId=' + recordId}>Record milk</Link>}{item.sex === 'female' && <Link className={secondaryClass} href={'/breeding/new?damId=' + recordId}>Record breeding</Link>}<Link className={secondaryClass} href={'/events/new?goatId=' + recordId}>Plan an event</Link></section><section aria-labelledby="history-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 id="history-title" className="text-xl font-semibold">Animal history</h2><p className="mt-2 text-sm text-slate-600">Health, breeding, measurements, and farm events in one record. Most recent 200 entries.</p>{history.length === 0 ? <p className="mt-6 text-sm text-slate-500">No history yet. Add the first record using the actions above.</p> : <ol className="mt-6 space-y-6 border-l border-green-800/20 pl-5">{history.map(entry => <li key={text(entry.kind) + text(entry.id)} className="relative"><span aria-hidden="true" className="absolute -left-[1.55rem] top-1.5 h-2 w-2 rounded-full bg-green-800"/><p className="text-xs font-semibold uppercase tracking-wide text-green-800">{text(entry.kind)} · {date(entry.occurred_at)}</p><Link href={text(entry.href)} className="mt-1 inline-flex min-h-11 items-center font-semibold text-slate-900 underline underline-offset-4">{text(entry.title)}</Link>{Boolean(entry.detail) && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{text(entry.detail)}</p>}</li>)}</ol>}</section></>}
    {remove.error && <ErrorNotice message={remove.error.message}/>}<footer className="border-t border-slate-200 pt-4"><button type="button" disabled={remove.isPending} onClick={() => { if (confirm('Delete this ' + config.title.toLowerCase() + '?')) remove.mutate(); }} className="min-h-11 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50">{remove.isPending ? 'Deleting…' : 'Delete record'}</button></footer>
  </>}</div>;
}
