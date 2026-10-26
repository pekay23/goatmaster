import { initDb, generateUUID } from './localDb';
const entities = new Set(['goats','inventory','sales','health_records','breeding_records','alerts','corrections','usage_logs','expenditures','milk_records','weight_records','farm_events']);
const aliases = { herd: 'goats', health: 'health_records', breeding: 'breeding_records', milk: 'milk_records', weights: 'weight_records', events: 'farm_events', usage: 'usage_logs' };
const scope = () => localStorage.getItem('goatmaster-session-scope') || 'anonymous';
const changed = () => window.dispatchEvent(new Event('goatmaster-queue-changed'));
export async function hasRemoteSession() {
  if (!navigator.onLine || scope() === 'anonymous') return false;
  try { const response = await fetch('/api/auth/me', { credentials: 'include' }); if (!response.ok) return false; const { data } = await response.json(); return data?.organization_id + ':' + data?.id === scope(); } catch { return false; }
}
export async function queueSyncAction(storeName, action, data) {
  const entity = aliases[storeName] || storeName;
  if (!entities.has(entity) || !['CREATE','UPDATE','DELETE'].includes(action) || !data?.id) throw new Error('Unsupported offline change');
  const db = await initDb();
  const current = await db.get(entity, data.id);
  await db.add('syncQueue', { storeName: entity, action, data, operationId: generateUUID(), baseVersion: Number(data.version ?? current?.version ?? 1), scope: scope(), timestamp: new Date().toISOString() });
  changed();
  if (navigator.onLine) void triggerSync();
}
let inFlight;
export function triggerSync() {
  if (inFlight) return inFlight;
  inFlight = processQueue().finally(() => { inFlight = null; changed(); });
  return inFlight;
}
async function processQueue() {
  if (!navigator.onLine || !await hasRemoteSession()) return false;
  const identity = scope(); const db = await initDb(); const queue = await db.getAll('syncQueue'); let success = true;
  for (const item of queue) {
    if (scope() !== identity) return false;
    if (item.conflict) { success = false; continue; }
    try {
      if (!item.operationId) { item.operationId = generateUUID(); item.baseVersion = item.data.version ?? 1; item.scope = identity; await db.put('syncQueue', item); }
      const entity = aliases[item.storeName] || item.storeName;
      if (!entities.has(entity) || (item.scope && item.scope !== identity)) { item.lastError = 'This change belongs to a different signed-in account'; await db.put('syncQueue',item); success = false; continue; }
      const response = await fetch('/api/app/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity, entityId: item.data.id, operationId: item.operationId, operation: item.action, baseVersion: item.baseVersion, data: item.data, scope: identity }) });
      const result = await response.json();
      if (response.ok) {
        const following = queue.filter(next=>next.id>item.id&&(aliases[next.storeName]||next.storeName)===entity&&next.data.id===item.data.id);
        if (result.record?.version && following[0] && !following[0].retryCount) {
          following[0].baseVersion=result.record.version;
          following[0].data.version=result.record.version;
          await db.put('syncQueue',following[0]);
        }
        if (!following.length) { if (result.record?.deleted_at) await db.delete(entity,item.data.id); else if (result.record) await db.put(entity,result.record); }
        await db.delete('syncQueue',item.id);
      } else if (response.status === 401 || response.status === 403) return false;
      else {
        item.lastError = result.error || 'The server could not save this change';
        item.retryCount = (item.retryCount || 0) + 1;
        if (response.status === 409) { item.conflict = true; item.serverRecord = result.current ?? null; }
        await db.put('syncQueue', item); success = false;
      }
    } catch { success = false; break; }
  }
  if (success) localStorage.setItem('goatmaster-last-sync:' + identity, new Date().toISOString());
  return success;
}
export async function resolveSyncConflict(id, choice) {
  const db = await initDb(); const item = await db.get('syncQueue',id); if (!item) return;
  if (choice === 'server') {
    if (!item.serverRecord || item.serverRecord.deleted_at) await db.delete(item.storeName,item.data.id); else await db.put(item.storeName,item.serverRecord);
    await db.delete('syncQueue',id);
  } else {
    if (!item.serverRecord || item.serverRecord.deleted_at) throw new Error('This record was deleted. Save your changes as a new record.');
    item.baseVersion = item.serverRecord.version; item.data.version = item.serverRecord.version; item.operationId = generateUUID(); item.conflict = false; item.lastError = null; item.serverRecord = null; await db.put('syncQueue',item);
  }
  changed();
  if (navigator.onLine) await triggerSync();
}
export async function syncStoreFromRemote(storeName) {
  const entity = aliases[storeName] || storeName;
  if (!entities.has(entity) || !navigator.onLine || !await hasRemoteSession()) return { skipped: true };
  const identity = scope(); const db = await initDb(); const key = 'goatmaster-sync-cursor:' + identity + ':' + entity;
  let cursor = localStorage.getItem(key); let hasMore = true;
  try {
    while (hasMore) {
      if (scope() !== identity) return { skipped: true };
      const params = new URLSearchParams({ entity }); if (cursor) params.set('cursor',cursor);
      const response = await fetch('/api/app/sync?' + params, { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to fetch synchronized records');
      const result = await response.json();
      const pending = new Set((await db.getAll('syncQueue')).filter(item => (aliases[item.storeName] || item.storeName) === entity).map(item => item.data.id));
      const tx = db.transaction(entity,'readwrite');
      for (const record of result.records) { if (pending.has(record.id)) continue; if (record.deleted_at) tx.store.delete(record.id); else tx.store.put(record); }
      await tx.done;
      cursor = result.nextCursor; if (cursor) localStorage.setItem(key,cursor); hasMore = result.hasMore === true;
    }
    return { skipped: false };
  } catch { return { skipped: true, reason: 'error' }; }
}
