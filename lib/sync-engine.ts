export type VectorClock = Record<string, number>;

export function incrementClock(clock: VectorClock, nodeId: string): VectorClock {
  return { ...clock, [nodeId]: (clock[nodeId] || 0) + 1 };
}

export function mergeClocks(a: VectorClock, b: VectorClock): VectorClock {
  const result: VectorClock = { ...a };
  for (const k of Object.keys(b)) {
    result[k] = Math.max(result[k] || 0, b[k]);
  }
  return result;
}

export type ClockRelation = 'equal' | 'before' | 'after' | 'concurrent';

export function compareClocks(a: VectorClock, b: VectorClock): ClockRelation {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLess = false;
  let bLess = false;
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    if (av < bv) aLess = true;
    if (av > bv) bLess = true;
  }
  if (!aLess && !bLess) return 'equal';
  if (aLess && !bLess) return 'before';
  if (!aLess && bLess) return 'after';
  return 'concurrent';
}

export interface SyncRecord {
  id: string;
  clock: VectorClock;
  updated_at: string;
  payload: any;
  nodeId: string;
}

export function detectConflict(local: SyncRecord, remote: SyncRecord): boolean {
  return compareClocks(local.clock, remote.clock) === 'concurrent';
}

export function resolveLWW(local: SyncRecord, remote: SyncRecord): SyncRecord {
  if (local.updated_at === remote.updated_at) {
    return local.nodeId < remote.nodeId ? local : remote;
  }
  return local.updated_at > remote.updated_at ? local : remote;
}

export function resolveConflict(local: SyncRecord, remote: SyncRecord): { winner: SyncRecord; conflict: boolean } {
  if (!detectConflict(local, remote)) {
    const rel = compareClocks(local.clock, remote.clock);
    if (rel === 'before') return { winner: remote, conflict: false };
    if (rel === 'after') return { winner: local, conflict: false };
    return { winner: resolveLWW(local, remote), conflict: false };
  }
  return { winner: resolveLWW(local, remote), conflict: true };
}
