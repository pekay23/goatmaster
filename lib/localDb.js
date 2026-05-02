import { openDB } from 'idb';

const DB_NAME = 'goat_master_cache';
const STORE_NAME = 'embeddings';
const VERSION = 1;

/**
 * localDb - Manages the on-device vector cache in IndexedDB.
 * This allows for instant re-identification without server round-trips.
 */

export async function initDb() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('goatId', 'goat_id');
      }
    },
  });
}

export async function saveEmbeddings(embeddings) {
  const db = await initDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  // Clear old cache and save new
  await store.clear();
  for (const emb of embeddings) {
    await store.put(emb);
  }
  await tx.done;
}

export async function getLocalMatch(inputEmbedding, threshold = 0.85) {
  const db = await initDb();
  const all = await db.getAll(STORE_NAME);
  
  let best = null;
  let bestScore = -1;

  for (const entry of all) {
    const score = cosineSimilarity(inputEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= threshold) {
    return { goat: best.goat, confidence: bestScore, method: 'local_reid' };
  }
  
  return null;
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
