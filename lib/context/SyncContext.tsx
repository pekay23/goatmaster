'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  pendingCount: number;
  error: string | null;
}

interface SyncContextType extends SyncStatus {
  triggerSync: () => Promise<void>;
  registerOfflineChange: (change: OfflineChange) => void;
}

interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
  vectorClock: Record<string, number>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSynced: null,
    pendingCount: 0,
    error: null,
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineChange[]>([]);

  // Load persisted queue
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('offline-queue');
    if (stored) {
      try {
        setOfflineQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }

    // Check for pending sync from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'GET_SYNC_STATUS' });
      });
    }
  }, []);

  // Persist queue
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      triggerSync();
    };
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          setStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSynced: new Date(),
            pendingCount: event.data.pendingCount || 0,
            error: null,
          }));
          setOfflineQueue([]);
        } else if (event.data.type === 'SYNC_ERROR') {
          setStatus(prev => ({
            ...prev,
            isSyncing: false,
            error: event.data.error,
          }));
        } else if (event.data.type === 'SYNC_STATUS') {
          setStatus(prev => ({
            ...prev,
            pendingCount: event.data.pendingCount || 0,
            lastSynced: event.data.lastSynced ? new Date(event.data.lastSynced) : prev.lastSynced,
          }));
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!status.isOnline || status.isSyncing || offlineQueue.length === 0) return;

    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Send to service worker for background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'SYNC_QUEUE',
          queue: offlineQueue,
        });
      } else {
        // Fallback: direct API calls
        for (const change of offlineQueue) {
          await fetch(`/api/app/sync/${change.entity}`, {
            method: change.type === 'delete' ? 'DELETE' : change.type === 'create' ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data),
          });
        }
        setOfflineQueue([]);
        setStatus(prev => ({ ...prev, isSyncing: false, lastSynced: new Date(), pendingCount: 0 }));
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      }));
    }
  }, [status.isOnline, status.isSyncing, offlineQueue]);

  const registerOfflineChange = useCallback((change: OfflineChange) => {
    setOfflineQueue(prev => [...prev, change]);
    setStatus(prev => ({ ...prev, pendingCount: prev.pendingCount + 1 }));
  }, []);

  return (
    <SyncContext.Provider value={{ ...status, triggerSync, registerOfflineChange }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// Sync indicator component
export function SyncIndicator() {
  const { isOnline, isSyncing, lastSynced, pendingCount, error } = useSync();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-orange-600" title="Offline">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="text-sm font-medium">Offline</span>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-orange-100 rounded-full">{pendingCount} pending</span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-600" title="Syncing">
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-medium">Syncing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600" title="Sync error">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm font-medium">Sync failed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600" title="Synced">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium">
        {lastSynced ? `Synced ${formatRelative(lastSynced)}` : 'Synced'}
      </span>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}