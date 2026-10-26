import { initDb } from '@/lib/localDb';
export type DataRecord = Record<string, unknown>;

export function object(value: unknown): DataRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {};
}

export function records(value: unknown): DataRecord[] {
  return Array.isArray(value) ? value.filter((item): item is DataRecord => typeof item === 'object' && item !== null && !Array.isArray(item)) : [];
}

export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;
}

export function number(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function date(value: unknown): string {
  const parsed = new Date(text(value));
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded';
}

const cacheMap: Record<string,{table:string;key:string}> = { goats:{table:'goats',key:'goats'},health:{table:'health_records',key:'records'},breeding:{table:'breeding_records',key:'records'},inventory:{table:'inventory',key:'items'},events:{table:'farm_events',key:'records'},weights:{table:'weight_records',key:'records'},milk:{table:'milk_records',key:'records'} };
async function offlineResponse(url:string):Promise<DataRecord> {
  const db=await initDb(); const parsed=new URL(url,window.location.origin); const parts=parsed.pathname.split('/').filter(Boolean); const config=cacheMap[parts[2]];
  const snapshot=await db.get('snapshots',url);
  if(config&&parts[3]) { const item=await db.get(config.table,parts[3]); if(!item||item.deleted_at) throw new Error('This record is not available on this device. Connect to load it.'); return {...object(snapshot?.body),record:item,goat:parts[2]==='goats'?item:undefined,item:parts[2]==='inventory'?item:undefined,_offline:true}; }
  if(!config) { if(snapshot) return {...object(snapshot.body),_offline:true,_cachedAt:snapshot.cachedAt}; throw new Error('This section has not been saved on this device. Connect to load it.'); }
  const all=records(await db.getAll(config.table)).filter(item=>!item.deleted_at);
  const search=(parsed.searchParams.get('search')||'').toLowerCase();
  const filtered=all.filter(item=>(!search||Object.values(item).some(value=>typeof value==='string'&&value.toLowerCase().includes(search)))&&['sex','status','type','category'].every(key=>!parsed.searchParams.get(key)||item[key]===parsed.searchParams.get(key)));
  const limit=25; const page=Math.max(1,Number(parsed.searchParams.get('page'))||1);
  return {[config.key]:filtered.slice((page-1)*limit,page*limit),total:filtered.length,totalPages:Math.ceil(filtered.length/limit),page,limit,_offline:true,stats:{total:all.length}};
}
async function cacheResponse(url:string,data:DataRecord) {
  if(typeof window==='undefined')return;
  const db=await initDb(); const parts=new URL(url,window.location.origin).pathname.split('/').filter(Boolean); const config=cacheMap[parts[2]];
  await db.put('snapshots',{id:url,body:data,cachedAt:new Date().toISOString()});
  if(!config)return;
  const items=parts[3]?[object(data.record??data.item??data.goat??data)]:records(data[config.key]);
  const pending = new Set(records(await db.getAll('syncQueue')).filter(item=>item.storeName===config.table).map(item=>object(item.data).id));
  const tx=db.transaction(config.table,'readwrite');
  for(const item of items)if(typeof item.id==='string'&&!pending.has(item.id))tx.store.put(item);
  await tx.done;
}

export async function requestApi(url: string, init?: RequestInit): Promise<DataRecord> {
  const get=!init?.method||init.method==='GET';
  if(get&&typeof navigator!=='undefined'&&!navigator.onLine)return offlineResponse(url);
  let response:Response;
  try{response=await fetch(url,{...init,credentials:'same-origin'});}catch(error){if(get&&typeof window!=='undefined')return offlineResponse(url);throw error;}
  const body:unknown=await response.json();const data=object(body);
  if(!response.ok)throw new Error(text(data.error,'The request could not be completed. Please try again.'));
  if(get)await cacheResponse(url,data).catch(()=>{});
  return data;
}

export const inputClass = 'mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800';
export const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50';

export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{message}</p>{retry && <button className="mt-2 min-h-11 font-semibold underline" onClick={retry}>Try again</button>}</div>;
}
