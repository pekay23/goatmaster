const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'were', 'are', 'been', 'be', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may',
  'might', 'shall', 'for', 'and', 'but', 'or', 'not', 'no', 'nor', 'so', 'yet',
  'to', 'of', 'in', 'on', 'at', 'by', 'from', 'with', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'it',
  'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them',
  'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'got', 'put',
  'set', 'took', 'done', 'made', 'get', 'gets', 'new', 'all',
]);

export function extractKeywords(text = '') {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/);

  const set = new Set();
  for (const word of words) {
    const cleaned = word.trim();
    if (cleaned.length > 2 && !STOPWORDS.has(cleaned) && !/^\d+$/.test(cleaned)) {
      set.add(cleaned);
    }
  }
  return Array.from(set);
}

export function computeKeywordAnalytics(farmEvents) {
  const counts = {};
  const categoryCounts = {};
  let totalTaggedGoats = 0;

  farmEvents.forEach(e => {
    const cat = e.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (Array.isArray(e.goat_ids)) {
      totalTaggedGoats += e.goat_ids.length;
    }
    const kws = (Array.isArray(e.keywords) && e.keywords.length > 0)
      ? e.keywords
      : extractKeywords(e.subject);
    kws.forEach(k => {
      const lower = k.toLowerCase();
      counts[lower] = (counts[lower] || 0) + 1;
    });
  });

  const sortedKeywords = Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return {
    topKeywords: sortedKeywords.slice(0, 15),
    allKeywordsCount: sortedKeywords.length,
    categoryCounts,
    totalEvents: farmEvents.length,
    totalTaggedGoats,
    topKeyword: sortedKeywords[0] || null,
  };
}