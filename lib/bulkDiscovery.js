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

function averageEmbedding(embeddings) {
  if (!embeddings.length) return [];
  const length = embeddings[0].length;
  const average = new Array(length).fill(0);
  for (const embedding of embeddings) {
    for (let i = 0; i < length; i += 1) average[i] += Number(embedding[i]) || 0;
  }
  return average.map((value) => value / embeddings.length);
}

function normaliseKnownEmbedding(record, index) {
  const goat = record.goat || record;
  const goatId = record.goatId ?? record.goat_id ?? goat.id;
  return {
    id: record.id || `${goatId}-${index}`,
    goatId,
    goat: {
      id: goatId,
      name: goat.name || record.goat_name || `Goat ${goatId}`,
      breed: goat.breed || record.breed || '',
      sex: goat.sex || record.sex || '',
      image_url: goat.image_url || record.image_url || null,
    },
    embedding: record.embedding || record.vector || record.values,
  };
}

export function estimateSharpness(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = Math.min(80, canvas.width);
  const height = Math.max(1, Math.round((canvas.height / canvas.width) * width));
  const sample = document.createElement('canvas');
  sample.width = width;
  sample.height = height;
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  sampleCtx.drawImage(canvas, 0, 0, width, height);
  const data = sampleCtx.getImageData(0, 0, width, height).data;

  let edgeTotal = 0;
  let count = 0;
  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const left = i - 4;
      const top = i - width * 4;
      const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const previous = (data[left] + data[left + 1] + data[left + 2] + data[top] + data[top + 1] + data[top + 2]) / 6;
      edgeTotal += Math.abs(current - previous);
      count += 1;
    }
  }

  return count ? edgeTotal / count / 255 : 0;
}

export class BulkDiscoverySession {
  constructor(knownEmbeddings = [], options = {}) {
    this.known = knownEmbeddings
      .map(normaliseKnownEmbedding)
      .filter((record) => record.goatId && Array.isArray(record.embedding));
    this.matches = new Map();
    this.candidates = [];
    this.matchThreshold = options.matchThreshold || 0.86;
    this.clusterThreshold = options.clusterThreshold || 0.82;
  }

  addFrame({ embedding, thumb, breed = '', sharpness = 0 }) {
    const knownMatch = this.findKnownMatch(embedding);
    const frame = { embedding, thumb, breed, sharpness };

    if (knownMatch) {
      const existing = this.matches.get(knownMatch.goat.id) || {
        goat: knownMatch.goat,
        frames: [],
        embeddings: [],
        bestThumb: null,
      };
      existing.frames.push(frame);
      existing.embeddings.push(embedding);
      if (!existing.bestThumb || sharpness >= Math.max(...existing.frames.map((f) => f.sharpness || 0))) {
        existing.bestThumb = thumb;
      }
      this.matches.set(knownMatch.goat.id, existing);
      return { status: 'matched', match: knownMatch };
    }

    const candidate = this.findCandidate(embedding);
    if (candidate) {
      candidate.frames.push(frame);
      candidate.embeddings.push(embedding);
      candidate.centroid = averageEmbedding(candidate.embeddings);
      if (!candidate.bestThumb || sharpness >= candidate.bestSharpness) {
        candidate.bestThumb = thumb;
        candidate.bestSharpness = sharpness;
      }
      if (breed && !candidate.breeds.includes(breed)) candidate.breeds.push(breed);
      return { status: 'merged', candidate };
    }

    const next = {
      candidateId: `candidate-${this.candidates.length + 1}`,
      frames: [frame],
      embeddings: [embedding],
      centroid: embedding,
      bestThumb: thumb,
      bestSharpness: sharpness,
      breeds: breed ? [breed] : [],
    };
    this.candidates.push(next);
    return { status: 'new', candidate: next };
  }

  findKnownMatch(embedding) {
    let best = null;
    for (const known of this.known) {
      const confidence = cosineSimilarity(embedding, known.embedding);
      if (!best || confidence > best.confidence) best = { ...known, confidence };
    }
    return best?.confidence >= this.matchThreshold ? best : null;
  }

  findCandidate(embedding) {
    let best = null;
    for (const candidate of this.candidates) {
      const confidence = cosineSimilarity(embedding, candidate.centroid);
      if (!best || confidence > best.confidence) best = { candidate, confidence };
    }
    return best?.confidence >= this.clusterThreshold ? best.candidate : null;
  }

  summarise(prefix = 'G', startIndex = 1) {
    const matched = Array.from(this.matches.values()).map((match) => ({
      goat: match.goat,
      frameCount: match.frames.length,
      embeddings: match.embeddings,
      bestThumb: match.bestThumb,
    }));

    const newGoats = this.candidates.map((candidate, index) => {
      const breed = candidate.breeds[0] || '';
      return {
        candidateId: candidate.candidateId,
        suggestedName: `${prefix}${String(startIndex + index).padStart(3, '0')}`,
        suggestedBreed: breed,
        suggestedSex: 'F',
        suggestedNotes: `Discovered by Smart Scan from ${candidate.frames.length} frame${candidate.frames.length === 1 ? '' : 's'}.`,
        frameCount: candidate.frames.length,
        bestThumb: candidate.bestThumb,
        embeddings: candidate.embeddings,
      };
    });

    return { matched, newGoats };
  }
}
