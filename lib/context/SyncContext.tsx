'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { initDb } from '@/lib/localDb';
import { triggerSync as syncPending, queueSyncAction, resolveSyncConflict } from '@/lib/sync';
type OfflineChange = { id: string; type: 'create'|'update'|'delete'; entity: string; entityId: string; data: Record<string, unknown>; timestamp: number; vectorClock: Record<string, number> };
type QueueItem = { id: number; storeName: string; data: Record<string, unknown>; lastError?: string; conflict?: boolean; serverRecord?: Record<string, unknown> | null };
type SyncStatus = { isOnline: boolean; isSyncing: boolean; lastSynced: Date | null; pendingCount: number; error: string | null; queue: QueueItem[] };
type SyncContextType = SyncStatus & { triggerSync: () => Promise<void>; registerOfflineChange: (change: OfflineChange) => void; resolveConflict: (id: number, choice: 'server'|'local') => Promise<void> };
const SyncContext = createContext<SyncContextType | null>(null);
export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>({ isOnline: true, isSyncing: false, lastSynced: null, pendingCount: 0, error: null, queue: [] });
  const syncing = useRef(false);
  const refresh = useCallback(async () => { const db = await initDb(); const queue: QueueItem[] = await db.getAll('syncQueue'); const last = localStorage.getItem('goatmaster-last-sync:' + localStorage.getItem('goatmaster-session-scope')); setStatus(previous => ({ ...previous, isOnline: navigator.onLine, pendingCount: queue.length, queue, lastSynced: last ? new Date(last) : previous.lastSynced })); }, []);
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || syncing.current) return;
    syncing.current = true; setStatus(previous => ({ ...previous, isOnline: true, isSyncing: true, error: null }));
    try { if (!await syncPending()) throw new Error('Some changes need attention. Your saved changes remain on this device.'); }
    catch (error) { setStatus(previous => ({ ...previous, error: error instanceof Error ? error.message : 'Sync failed' })); }
    finally { syncing.current = false; setStatus(previous => ({ ...previous, isSyncing: false })); await refresh(); }
  }, [refresh]);
  useEffect(() => {
    void refresh();
    const online = () => { void triggerSync(); }; const offline = () => setStatus(previous => ({ ...previous, isOnline: false })); const changed = () => { void refresh(); };
    const message = (event: MessageEvent) => { if (event.data?.type === 'SYNC_QUEUE') void triggerSync(); };
    window.addEventListener('online',online); window.addEventListener('offline',offline); window.addEventListener('goatmaster-queue-changed',changed); navigator.serviceWorker?.addEventListener('message',message);
    return () => { window.removeEventListener('online',online); window.removeEventListener('offline',offline); window.removeEventListener('goatmaster-queue-changed',changed); navigator.serviceWorker?.removeEventListener('message',message); };
  }, [refresh,triggerSync]);
  const registerOfflineChange = useCallback((change: OfflineChange) => { void queueSyncAction(change.entity,change.type.toUpperCase(),{ ...change.data,id:change.entityId }).then(refresh).catch(error=>setStatus(previous=>({...previous,error:error.message}))); }, [refresh]);
  const resolveConflict = useCallback(async (id: number,choice: 'server'|'local') => { try { await resolveSyncConflict(id,choice); await refresh(); } catch(error) { setStatus(previous=>({...previous,error:error instanceof Error ? error.message : 'Unable to resolve conflict'})); } }, [refresh]);
  return <SyncContext.Provider value={{ ...status,triggerSync,registerOfflineChange,resolveConflict }}>{children}</SyncContext.Provider>;
}
export function useSync() { const context=useContext(SyncContext); if(!context) throw new Error('useSync must be used within a SyncProvider'); return context; }
const display=(value: unknown)=>value==null||value===''?'Not set':typeof value==='object'?JSON.stringify(value):String(value);
export function SyncIndicator() {
  const { isOnline,isSyncing,pendingCount,lastSynced,error,queue,resolveConflict,triggerSync }=useSync();
  return <details className="relative"><summary className="cursor-pointer rounded-lg border px-3 py-2 text-sm"><span role="status">{!isOnline?'Offline':isSyncing?'Syncing…':error?'Changes need attention':pendingCount?pendingCount+' pending':lastSynced?'Synced':'Online'}</span></summary><div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[min(25rem,85vw)] space-y-4 overflow-auto rounded-xl border bg-white p-4 text-slate-900 shadow-lg"><p className="text-sm">{pendingCount ? pendingCount+' changes saved on this device.' : 'No pending changes.'}</p>{error&&<p role="alert" className="text-sm text-red-800">{error}</p>}{queue.map(item=><section className="space-y-2 border-t pt-3" key={item.id}><h3 className="text-sm font-semibold">{item.conflict?'Review changes to ':'Pending change to '}{item.storeName.replaceAll('_',' ')}</h3>{item.lastError&&<p className="text-xs">{item.lastError}</p>}{item.conflict&&<><dl className="space-y-2 text-xs">{Object.entries(item.data).filter(([key])=>!['id','version','updated_at','created_at','owner_id','organization_id'].includes(key)).slice(0,6).map(([key,value])=><div key={key}><dt className="font-semibold">{key.replaceAll('_',' ')}</dt><dd>On this device: {display(value)}</dd><dd>On the server: {display(item.serverRecord?.[key])}</dd></div>)}</dl><div className="flex flex-wrap gap-2"><button className="rounded border px-3 py-2 text-sm" onClick={()=>void resolveConflict(item.id,'server')}>Use server version</button>{item.serverRecord&&!item.serverRecord.deleted_at&&<button className="rounded bg-green-800 px-3 py-2 text-sm text-white" onClick={()=>void resolveConflict(item.id,'local')}>Keep my changes</button>}</div></>}</section>)}<button disabled={!isOnline||isSyncing||pendingCount===0} className="rounded border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>void triggerSync()}>Retry sync</button></div></details>;
}
