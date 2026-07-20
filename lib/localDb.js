import { openDB } from 'idb';

const DB_NAME = 'goatmaster-local';
const DB_VERSION = 3;

let dbPromise;

export function generateUUID() {
  // Fallback for environments without crypto.randomUUID (like HTTP local network)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function initDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('embeddings')) {
          const store = db.createObjectStore('embeddings', { keyPath: 'id' });
          store.createIndex('goatId', 'goatId');
        }
        if (!db.objectStoreNames.contains('goats')) {
          db.createObjectStore('goats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('health_records')) {
          db.createObjectStore('health_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('breeding_records')) {
          db.createObjectStore('breeding_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('usage_logs')) {
          db.createObjectStore('usage_logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('expenditures')) {
          db.createObjectStore('expenditures', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('milk_records')) {
          db.createObjectStore('milk_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('weight_records')) {
          db.createObjectStore('weight_records', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function cosineSimilarity(a, b) {
  const length = Math.min(a?.length || 0, b?.length || 0);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normaliseRecord(record, index) {
  const goat = record.goat || record;
  const goatId = record.goatId ?? record.goat_id ?? goat.id;
  const embedding = record.embedding || record.vector || record.values;

  return {
    id: record.id || `${goatId}-${index}`,
    goatId,
    goat: {
      id: goatId,
      name: goat.name || record.goat_name || `Goat ${goatId}`,
      breed: goat.breed || record.breed || '',
      sex: goat.sex || record.sex || '',
      image_url: goat.image_url || record.image_url || null,
      ear_tag: goat.ear_tag || record.ear_tag || '',
    },
    embedding,
  };
}

export async function saveEmbeddings(records = []) {
  const db = await initDb();
  const tx = db.transaction('embeddings', 'readwrite');
  await tx.store.clear();

  records
    .map(normaliseRecord)
    .filter((record) => record.goatId && Array.isArray(record.embedding))
    .forEach((record) => tx.store.put(record));

  await tx.done;
}

export async function getLocalMatch(embedding, threshold = 0.88) {
  const db = await initDb();
  const records = await db.getAll('embeddings');

  let best = null;
  for (const record of records) {
    const confidence = cosineSimilarity(embedding, record.embedding);
    if (!best || confidence > best.confidence) {
      best = { goat: record.goat, confidence, lowConfidence: confidence < threshold };
    }
  }

  return best && best.confidence >= threshold ? best : null;
}
