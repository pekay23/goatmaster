import { initDb } from './localDb';

const STORE_TO_ROUTE = {
  health_records: 'health',
  breeding_records: 'breeding',
  usage_logs: 'usage',
  expenditures: 'expenditures',
  milk_records: 'milk',
  weight_records: 'weights',
  farm_events: 'events'
};

export async function hasRemoteSession() {
  if (!navigator.onLine) return false;

  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

// Queue an offline action (CREATE, UPDATE, DELETE)
export async function queueSyncAction(storeName, action, data) {
  const db = await initDb();
  await db.add('syncQueue', {
    storeName,
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  if (navigator.onLine && await hasRemoteSession()) {
    triggerSync();
  }
}

// Process the sync queue
export async function triggerSync() {
  if (!navigator.onLine) return;
  if (!await hasRemoteSession()) return false;
  
  const db = await initDb();
  const queue = await db.getAll('syncQueue');
  if (queue.length === 0) return true;

  let allSuccess = true;
  for (const item of queue) {
    try {
      const { storeName, action, data } = item;
      const routePath = STORE_TO_ROUTE[storeName] || storeName;
      let url = `/api/${routePath}`;
      let method = 'POST';
      let body = data;

      if (action === 'UPDATE') {
        url = `/api/${routePath}/${data.id}`;
        method = 'PUT';
      } else if (action === 'DELETE') {
        url = `/api/${routePath}/${data.id}`;
        method = 'DELETE';
        body = null;
      }

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include'
      });

      if (res.ok) {
        await db.delete('syncQueue', item.id);
      } else if (res.status === 401) {
        return false;
      } else {
        console.error('Failed to sync item:', item);
        
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount >= 3) {
          console.warn('Item failed to sync 3 times, dropping from queue:', item);
          await db.delete('syncQueue', item.id);
        } else {
          await db.put('syncQueue', item);
        }
        
        allSuccess = false;
      }
    } catch (err) {
      console.error('Network error during sync:', err);
      allSuccess = false;
      break; // Stop syncing if we hit a network error
    }
  }
  return allSuccess;
}

// Helper to fetch and cache all entities of a specific store
export async function syncStoreFromRemote(storeName) {
  if (!navigator.onLine) return;
  
  try {
    const routePath = STORE_TO_ROUTE[storeName] || storeName;
    const db = await initDb();
    
    // Find the latest updated_at in the local store
    const localItems = await db.getAll(storeName);
    let maxUpdatedAt = '1970-01-01T00:00:00Z';
    
    for (const item of localItems) {
      if (item.updated_at && item.updated_at > maxUpdatedAt) {
        maxUpdatedAt = item.updated_at;
      }
    }
    
    let hasMore = true;
    const limit = 500;
    
    while (hasMore) {
      const res = await fetch(`/api/${routePath}?updated_after=${maxUpdatedAt}&limit=${limit}`, { credentials: 'include' });
      if (res.status === 401) return { skipped: true, reason: 'unauthorized' };
      if (!res.ok) throw new Error('Failed to fetch from API');
      
      const data = await res.json();
      
      if (data.length > 0) {
        const tx = db.transaction(storeName, 'readwrite');
        for (const item of data) {
          tx.store.put(item);
        }
        await tx.done;
      }
      
      if (data.length < limit) {
        hasMore = false;
      } else {
        // API returns ORDER BY updated_at ASC, so last item is the most recent
        maxUpdatedAt = data[data.length - 1].updated_at;
      }
    }
    return { skipped: false };
  } catch (err) {
    console.warn(`Remote sync skipped for ${storeName}:`, err.message || err);
    return { skipped: true, reason: 'error' };
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', triggerSync);
}
