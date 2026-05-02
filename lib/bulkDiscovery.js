/**
 * Bulk Discovery — clusters embeddings from multiple frames into "candidates"
 * and identifies which match existing goats vs which are new.
 *
 * Strategy:
 *   1. For each new embedding, compare against (a) existing goats and (b) other
 *      candidates already discovered in this session.
 *   2. If similarity ≥ 0.88 to an existing goat → MATCHED
 *   3. If similarity ≥ 0.78 to another candidate in this session → MERGED into candidate
 *   4. Otherwise → NEW candidate
 *
 * Each candidate keeps its embeddings, frame thumbnails, and breed votes so we
 * can surface the best image and most-likely breed when presenting to the user.
 */

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

const MATCH_THRESHOLD = 0.88;   // Same as live scanner — definite match
const CLUSTER_THRESHOLD = 0.78; // Looser — same animal across frames in this session

export class BulkDiscoverySession {
  constructor(existingEmbeddings = []) {
    // existingEmbeddings: [{ embedding, goat: { id, name, breed, ... } }, ...]
    this.existing = existingEmbeddings;
    this.matches = new Map();    // goatId -> { goat, frames: [{thumb, embedding, breed}], frameCount }
    this.candidates = [];        // { id, frames, embeddingCentroid, breedVotes, bestThumb }
    this.nextCandidateId = 1;
  }

  /**
   * Process one frame.
   * @param {{ embedding:number[], thumb:string, breed:string, sharpness:number }} frame
   * @returns {{ status:'matched'|'merged'|'new', goat?, candidateId? }}
   */
  addFrame(frame) {
    // 1. Try matching against existing goats
    let bestExisting = null, bestExistingScore = 0;
    for (const e of this.existing) {
      const s = cosine(frame.embedding, e.embedding);
      if (s > bestExistingScore) { bestExistingScore = s; bestExisting = e; }
    }
    if (bestExisting && bestExistingScore >= MATCH_THRESHOLD) {
      const goatId = bestExisting.goat.id;
      const entry = this.matches.get(goatId) || { goat: bestExisting.goat, frames: [] };
      entry.frames.push(frame);
      this.matches.set(goatId, entry);
      return { status: 'matched', goat: bestExisting.goat };
    }

    // 2. Try merging into an existing candidate from this session
    let bestCandidate = null, bestCandidateScore = 0;
    for (const cand of this.candidates) {
      const s = cosine(frame.embedding, cand.embeddingCentroid);
      if (s > bestCandidateScore) { bestCandidateScore = s; bestCandidate = cand; }
    }
    if (bestCandidate && bestCandidateScore >= CLUSTER_THRESHOLD) {
      bestCandidate.frames.push(frame);
      bestCandidate.breedVotes[frame.breed] = (bestCandidate.breedVotes[frame.breed] || 0) + 1;
      // Update centroid (running average)
      const n = bestCandidate.frames.length;
      bestCandidate.embeddingCentroid = bestCandidate.embeddingCentroid.map(
        (v, i) => v + (frame.embedding[i] - v) / n
      );
      // Update best thumb if this frame is sharper
      if (frame.sharpness > bestCandidate.bestSharpness) {
        bestCandidate.bestThumb = frame.thumb;
        bestCandidate.bestSharpness = frame.sharpness;
      }
      return { status: 'merged', candidateId: bestCandidate.id };
    }

    // 3. New candidate
    const candidate = {
      id: this.nextCandidateId++,
      frames: [frame],
      embeddingCentroid: [...frame.embedding],
      breedVotes: { [frame.breed]: 1 },
      bestThumb: frame.thumb,
      bestSharpness: frame.sharpness,
    };
    this.candidates.push(candidate);
    return { status: 'new', candidateId: candidate.id };
  }

  /**
   * Generate the final summary with smart-defaulted goat profiles
   * @param {string} farmCode  — short code for naming (e.g. "P" for Pekay)
   * @param {number} startNumber — what number to start naming from
   */
  summarise(farmCode = 'G', startNumber = 1) {
    const matchedSummary = Array.from(this.matches.values()).map(m => ({
      type: 'matched',
      goat: m.goat,
      frameCount: m.frames.length,
      bestThumb: m.frames.reduce(
        (best, f) => (!best || f.sharpness > best.sharpness ? f : best), null
      )?.thumb,
      embeddings: m.frames.map(f => f.embedding),
    }));

    const newSummary = this.candidates.map((c, i) => {
      const dominantBreed = Object.entries(c.breedVotes)
        .sort((a, b) => b[1] - a[1])[0][0];
      const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const num = String(startNumber + i).padStart(3, '0');
      return {
        type: 'new',
        candidateId: c.id,
        suggestedName: `${farmCode}-${num}`,
        suggestedBreed: dominantBreed === 'Unknown' ? '' : dominantBreed,
        suggestedSex: 'F', // default to doe — most common in dairy
        suggestedNotes: `Auto-discovered ${date} via Smart Scan`,
        bestThumb: c.bestThumb,
        frameCount: c.frames.length,
        embeddings: c.frames.map(f => f.embedding),
      };
    });

    return { matched: matchedSummary, newGoats: newSummary };
  }
}

/**
 * Estimate sharpness of an image (Laplacian variance). Higher = sharper.
 * Used to pick the best thumbnail for each candidate.
 */
export function estimateSharpness(canvas) {
  const ctx = canvas.getContext('2d');
  const w = Math.min(canvas.width, 200);
  const h = Math.min(canvas.height, 200);
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const grey = (data[i] + data[i+1] + data[i+2]) / 3;
      const top = (data[i - w*4] + data[i - w*4 + 1] + data[i - w*4 + 2]) / 3;
      const bot = (data[i + w*4] + data[i + w*4 + 1] + data[i + w*4 + 2]) / 3;
      const lft = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
      const rgt = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
      const lap = -4 * grey + top + bot + lft + rgt;
      sum += lap; sumSq += lap * lap; count++;
    }
  }
  const mean = sum / count;
  return Math.sqrt(sumSq / count - mean * mean);
}
