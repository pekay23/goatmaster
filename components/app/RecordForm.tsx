'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateUUID, initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { buttonClass, secondaryClass, ErrorNotice, inputClass, object, records, requestApi, text, DataRecord } from './record-data';
import type { RecordSection } from './record-schema';
export type { RecordSection } from './record-schema';

type FormValues = Record<string, string>;
type Field = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'url' | 'textarea' | 'select'; required?: boolean; integer?: boolean; options?: string[] };
export const recordConfiguration: Record<RecordSection, { title: string; table: string; endpoint: string; fields: Field[] }> = {
  herd: { title: 'Goat', table: 'goats', endpoint: 'goats', fields: [
    { name: 'name', label: 'Name', required: true }, { name: 'sex', label: 'Sex', type: 'select', required: true, options: ['female', 'male', 'unknown'] },
    { name: 'breed', label: 'Breed' }, { name: 'ear_tag', label: 'Ear tag' }, { name: 'dob', label: 'Date of birth', type: 'date' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'pregnant', 'for_sale', 'sold', 'deceased'] },
    { name: 'image_url', label: 'Photo URL', type: 'url' }, { name: 'dam_id', label: 'Dam', type: 'select' }, { name: 'sire_id', label: 'Sire', type: 'select' },
  ] },
  health: { title: 'Health record', table: 'health_records', endpoint: 'health', fields: [
    { name: 'goat_id', label: 'Goat', type: 'select', required: true }, { name: 'type', label: 'Record type', type: 'select', required: true, options: ['vaccination', 'deworming', 'treatment', 'checkup', 'injury', 'illness', 'supplement', 'other'] },
    { name: 'record_date', label: 'Record date', type: 'date', required: true }, { name: 'next_due_date', label: 'Next due date', type: 'date' }, { name: 'treatment', label: 'Treatment' }, { name: 'cost', label: 'Cost per animal (GHS)', type: 'number' }, { name: 'notes', label: 'Notes', type: 'textarea' },
  ] },
  breeding: { title: 'Breeding record', table: 'breeding_records', endpoint: 'breeding', fields: [
    { name: 'dam_id', label: 'Dam', type: 'select', required: true }, { name: 'sire_id', label: 'Sire', type: 'select' }, { name: 'mating_date', label: 'Mating date', type: 'date' }, { name: 'expected_kidding_date', label: 'Expected kidding date', type: 'date' },
    { name: 'actual_kidding_date', label: 'Actual kidding date', type: 'date' }, { name: 'kids_count', label: 'Kids count', type: 'number', integer: true }, { name: 'status', label: 'Status', type: 'select', required: true, options: ['planned', 'mated', 'confirmed', 'kidded', 'failed'] }, { name: 'notes', label: 'Notes', type: 'textarea' },
  ] },
  inventory: { title: 'Inventory item', table: 'inventory', endpoint: 'inventory', fields: [
    { name: 'name', label: 'Item name', required: true }, { name: 'category', label: 'Category', type: 'select', required: true, options: ['feed', 'medicine', 'supplement', 'equipment', 'bedding', 'fencing', 'other'] }, { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'unit', label: 'Unit', required: true }, { name: 'low_stock_threshold', label: 'Low stock threshold', type: 'number' }, { name: 'unit_price', label: 'Unit price (GHS)', type: 'number' }, { name: 'supplier', label: 'Supplier' },
  ] },
  events: { title: 'Farm event', table: 'farm_events', endpoint: 'events', fields: [
    { name: 'subject', label: 'Event title', required: true }, { name: 'event_date', label: 'Event date', type: 'date', required: true }, { name: 'category', label: 'Category', type: 'select', options: ['General', 'Health', 'Breeding', 'Birth', 'Visit', 'Maintenance'] }, { name: 'goat_id', label: 'Related animal (optional)', type: 'select' }, { name: 'details', label: 'Details', type: 'textarea' },
  ] },
  weights: { title: 'Weight record', table: 'weight_records', endpoint: 'weights', fields: [{ name: 'goat_id', label: 'Goat', type: 'select', required: true }, { name: 'weight_kg', label: 'Weight (kg)', type: 'number', required: true }, { name: 'record_date', label: 'Record date', type: 'date', required: true }, { name: 'notes', label: 'Notes', type: 'textarea' }] },
  milk: { title: 'Milk record', table: 'milk_records', endpoint: 'milk', fields: [{ name: 'goat_id', label: 'Goat', type: 'select', required: true }, { name: 'record_date', label: 'Record date', type: 'date', required: true }, { name: 'morning_yield', label: 'Morning yield (L)', type: 'number' }, { name: 'evening_yield', label: 'Evening yield (L)', type: 'number' }, { name: 'notes', label: 'Notes', type: 'textarea' }] },
};

function valuesFor(section: RecordSection, record?: DataRecord, prefill?: FormValues): FormValues {
  const values: FormValues = {};
  for (const field of recordConfiguration[section].fields) {
    const value = record?.[field.name] ?? (field.name === 'low_stock_threshold' ? record?.min_quantity : undefined);
    values[field.name] = value == null ? '' : field.type === 'date' ? text(value).slice(0, 10) : text(value);
  }
  if (!record) {
    const today = new Date().toLocaleDateString('en-CA');
    if ('record_date' in values) values.record_date = today;
    if (section === 'herd') values.status = 'active';
    if (section === 'breeding') { values.status = 'planned'; values.kids_count = '0'; }
    if (section === 'inventory') { values.category = 'other'; values.unit = 'unit'; values.quantity = '0'; values.low_stock_threshold = '0'; values.unit_price = '0'; }
    if (section === 'events') { values.category = 'General'; values.event_date = today; }
    if (section === 'milk') { values.morning_yield = '0'; values.evening_yield = '0'; }
    for (const [key, value] of Object.entries(prefill ?? {})) if (key in values) values[key] = value;
  }
  return values;
}

export async function loadGoatOptions() {
  const result: DataRecord[] = [];
  let page = 1;
  let totalPages = 1;
  do { const body = await requestApi('/api/app/goats?limit=100&page=' + page); result.push(...records(body.goats)); totalPages = Number(body.totalPages) || 1; page++; } while (page <= totalPages);
  return result;
}

export function RecordForm({ section, recordId, prefill, returnTo }: { section: RecordSection; recordId?: string; prefill?: FormValues; returnTo?: string }) {
  const config = recordConfiguration[section];
  const recordQuery = useQuery({ queryKey: ['record-form', section, recordId], queryFn: async () => { const body = await requestApi('/api/app/' + config.endpoint + '/' + recordId); return object(body.record ?? body.item ?? body.goat ?? body); }, enabled: Boolean(recordId) });
  const goats = useQuery({ queryKey: ['goats', 'form-options'], queryFn: loadGoatOptions, enabled: section !== 'inventory' });
  if (recordId && recordQuery.isLoading) return <p role="status" className="p-6">Loading record…</p>;
  if (recordQuery.error) return <ErrorNotice message={recordQuery.error.message} retry={() => { void recordQuery.refetch(); }}/>;
  return <RecordEditor key={section + ':' + (recordId ?? 'new') + ':' + text(recordQuery.data?.version)} section={section} recordId={recordId} record={recordQuery.data} prefill={prefill} returnTo={returnTo} goats={goats.data ?? []} goatError={goats.error?.message}/>;
}

function subscribeDraft(callback: () => void) { window.addEventListener('storage', callback); window.addEventListener('goatmaster-draft-change', callback); return () => { window.removeEventListener('storage', callback); window.removeEventListener('goatmaster-draft-change', callback); }; }

function RecordEditor({ section, recordId, record, prefill, returnTo, goats, goatError }: { section: RecordSection; recordId?: string; record?: DataRecord; prefill?: FormValues; returnTo?: string; goats: DataRecord[]; goatError?: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const config = recordConfiguration[section];
  const destination = returnTo?.startsWith('/' + section + '?') || returnTo === '/' + section ? returnTo : '/' + section;
  const [values, setValues] = useState(() => valuesFor(section, record, prefill));
  const [notice, setNotice] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const isOnline = useSyncExternalStore(callback => { window.addEventListener('online',callback); window.addEventListener('offline',callback); return () => { window.removeEventListener('online',callback); window.removeEventListener('offline',callback); }; }, () => navigator.onLine, () => true);
  const scope = typeof window === 'undefined' ? '' : localStorage.getItem('goatmaster-session-scope') || '';
  const draftKey = 'goatmaster-draft:' + scope + ':' + section + ':' + (recordId ?? 'new');
  const storedDraft = useSyncExternalStore(subscribeDraft, () => localStorage.getItem(draftKey), () => null);
  const draft = storedDraft ? (() => { try { return object(JSON.parse(storedDraft)); } catch { return {}; } })() : null;
  function clearDraft() { localStorage.removeItem(draftKey); window.dispatchEvent(new Event('goatmaster-draft-change')); setDraftSaved(false); }
  function update(name: string, value: string) {
    const updated = { ...values, [name]: value };
    setValues(updated);
    try { localStorage.setItem(draftKey, JSON.stringify({ values: updated, savedAt: new Date().toISOString(), baseVersion: record?.version ?? null })); setDraftSaved(true); window.dispatchEvent(new Event('goatmaster-draft-change')); }
    catch { setNotice('Your browser could not save this draft. Keep this page open until you save.'); }
  }
  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | number | null> = { ...values };
      for (const field of config.fields) {
        if (field.type === 'number') payload[field.name] = Number(values[field.name] || 0);
        if (field.type === 'date' || ['dam_id', 'sire_id', 'goat_id'].includes(field.name)) if (!values[field.name]) payload[field.name] = null;
      }
      if (typeof record?.version === 'number') payload.version = record.version;
      if (!navigator.onLine) {
        const id = recordId || generateUUID();
        const pending = { ...record, ...payload, id, updated_at: new Date().toISOString(), deleted_at: null, sync_status: 'pending' };
        const db = await initDb();
        await queueSyncAction(config.table, recordId ? 'UPDATE' : 'CREATE', pending);
        await db.put(config.table, pending);
        return;
      }
      await requestApi('/api/app/' + config.endpoint + (recordId ? '/' + recordId : ''), { method: recordId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
    onSuccess: async () => { clearDraft(); await cache.invalidateQueries(); router.push(destination); router.refresh(); },
  });
  function renderField(field: Field) {
    const animalChoices = goats.filter(goat => text(goat.id) !== recordId && (field.name !== 'dam_id' || goat.sex === 'female') && (field.name !== 'sire_id' || goat.sex === 'male'));
    const options = field.options ? field.options.map(value => ({ id: value, label: value.replaceAll('_', ' ').replace(/^./, initial => initial.toUpperCase()) })) : animalChoices.map(goat => ({ id: text(goat.id), label: text(goat.name) + (goat.ear_tag ? ' · ' + text(goat.ear_tag) : '') }));
    const common = { id: 'record-' + field.name, name: field.name, required: field.required, value: values[field.name] || '', onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(field.name, event.target.value), className: inputClass };
    return <label htmlFor={common.id} key={field.name} className={'block text-sm font-medium text-slate-800 ' + (field.type === 'textarea' ? 'sm:col-span-2' : '')}>{field.label}{field.required && <span aria-hidden="true"> *</span>}{field.type === 'textarea' ? <textarea {...common} rows={4}/> : field.type === 'select' ? <select {...common}><option value="">{field.required ? 'Select an option' : 'Not recorded'}</option>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select> : <input {...common} type={field.type || 'text'} min={field.type === 'number' ? field.name === 'weight_kg' ? '0.01' : '0' : undefined} step={field.type === 'number' ? field.integer ? '1' : '0.01' : undefined} maxLength={field.type === 'text' || !field.type ? 500 : undefined}/>}</label>;
  }
  return <div className="mx-auto max-w-3xl space-y-5 py-4"><Link className="inline-flex min-h-11 items-center text-sm text-green-800 underline" href={destination}>Back to {section}</Link><header><p className="text-sm font-semibold uppercase tracking-widest text-green-800">Your farm notebook</p><h1 className="mt-2 font-serif text-3xl font-semibold">{recordId ? 'Edit ' : 'Add '}{config.title.toLowerCase()}</h1><p className="mt-2 text-sm text-slate-600">{isOnline ? 'Saved to your organization when you submit.' : 'Offline. Your record will be saved on this device and queued for sync.'}</p></header>{draft && !draftSaved && <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p>A draft is available from {new Date(text(draft.savedAt)).toLocaleString()}.{draft.baseVersion && draft.baseVersion !== record?.version ? ' The saved record has changed since this draft.' : ''}</p><div className="flex gap-4"><button type="button" className="min-h-11 font-semibold underline" onClick={() => { const saved = object(draft.values); const restored = { ...values }; for (const key of Object.keys(restored)) if (typeof saved[key] === 'string') restored[key] = saved[key]; setValues(restored); setDraftSaved(true); }}>Restore draft</button><button type="button" className="min-h-11 underline" onClick={clearDraft}>Discard draft</button></div></div>}{goatError && <ErrorNotice message={goatError}/>}<form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setNotice(''); save.mutate(); }} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2">{config.fields.filter(field => !(recordId && section === 'events' && field.name === 'goat_id')).map(renderField)}</div>{save.error && <ErrorNotice message={save.error.message}/>}<p role="status" className="text-xs text-slate-500">{notice || (draftSaved ? 'Draft saved on this device.' : 'Fields marked * are required.')}</p><div className="flex flex-wrap gap-3"><button className={buttonClass} type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : navigator.onLine ? 'Save record' : 'Save on this device'}</button><Link className={secondaryClass} href={destination}>Cancel</Link></div></form></div>;
}
