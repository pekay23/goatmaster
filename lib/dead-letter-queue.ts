import { openDB } from 'idb';

const DB_NAME = 'goatmaster-dlq';
const STORE = 'deadLetterQueue';

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('storeName', 'storeName');
        s.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

export interface DeadLetterEntry {
  id?: number;
  storeName: string;
  action: string;
  data: any;
  error: string;
  retryCount: number;
  createdAt: string;
  lastAttemptAt: string;
}

export async function enqueueDeadLetter(entry: Omit<DeadLetterEntry, 'id' | 'createdAt' | 'lastAttemptAt'> & { createdAt?: string; lastAttemptAt?: string }): Promise<number> {
  const d = await db();
  const now = new Date().toISOString();
  const id = await d.add(STORE, {
    storeName: entry.storeName,
    action: entry.action,
    data: entry.data,
    error: entry.error,
    retryCount: entry.retryCount ?? 0,
    createdAt: entry.createdAt ?? now,
    lastAttemptAt: entry.lastAttemptAt ?? now,
  });
  return id as number;
}

export async function listDeadLetters(): Promise<DeadLetterEntry[]> {
  const d = await db();
  return d.getAll(STORE);
}

export async function removeDeadLetter(id: number): Promise<void> {
  const d = await db();
  await d.delete(STORE, id);
}

export async function retryDeadLetter(id: number, handler: (entry: DeadLetterEntry) => Promise<boolean>): Promise<boolean> {
  const d = await db();
  const entry = await d.get(STORE, id);
  if (!entry) return false;
  const ok = await handler(entry);
  if (ok) await d.delete(STORE, id);
  else {
    entry.retryCount += 1;
    entry.lastAttemptAt = new Date().toISOString();
    await d.put(STORE, entry);
  }
  return ok;
}

export async function clearDeadLetters(): Promise<void> {
  const d = await db();
  await d.clear(STORE);
}
