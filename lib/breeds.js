const colour = (r, g, b) => ({ r, g, b });

export const BREEDS = [
  {
    id: 'mixed',
    name: 'Mixed / Unknown',
    type: 'dual',
    origin: 'Various',
    earType: 'varied',
    faceProfile: 'varied',
    coatTexture: 'varied',
    sizeKg: [25, 50, 35, 80],
    colourPatterns: ['mixed', 'solid', 'spotted'],
    colours: [colour(139, 92, 52), colour(245, 245, 238), colour(45, 38, 32)],
    distinguishing: 'Mixed goats can show traits from several breeds, so use this when no strong breed signal is present.',
    keywords: ['goat', 'kid', 'animal'],
  },
  {
    id: 'boer',
    name: 'Boer',
    type: 'meat',
    origin: 'South Africa',
    earType: 'pendulous',
    faceProfile: 'convex',
    coatTexture: 'short',
    sizeKg: [70, 90, 90, 135],
    colourPatterns: ['white body', 'red head', 'paint'],
    colours: [colour(245, 240, 225), colour(139, 50, 32)],
    distinguishing: 'Large-framed meat goat, usually white-bodied with a red or brown head and long drooping ears.',
    keywords: ['boer', 'red', 'brown', 'white', 'meat'],
  },
  {
    id: 'nubian',
    name: 'Nubian',
    type: 'dairy',
    origin: 'United Kingdom / North Africa',
    earType: 'long pendulous',
    faceProfile: 'roman',
    coatTexture: 'short',
    sizeKg: [55, 80, 75, 110],
    colourPatterns: ['solid', 'spotted', 'roan'],
    colours: [colour(122, 72, 39), colour(214, 191, 153), colour(28, 24, 20)],
    distinguishing: 'Tall dairy goat with very long floppy ears and a pronounced Roman nose.',
    keywords: ['nubian', 'anglo', 'ear', 'roman', 'dairy'],
  },
  {
    id: 'kiko',
    name: 'Kiko',
    type: 'meat',
    origin: 'New Zealand',
    earType: 'medium',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [45, 70, 70, 115],
    colourPatterns: ['white', 'cream', 'solid'],
    colours: [colour(238, 235, 220), colour(202, 190, 160)],
    distinguishing: 'Hardy meat goat, often white or cream, with a rangy build and strong parasite resistance.',
    keywords: ['kiko', 'white', 'cream', 'meat'],
  },
  {
    id: 'pygmy',
    name: 'Pygmy',
    type: 'companion',
    origin: 'West Africa',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [24, 35, 27, 39],
    colourPatterns: ['agouti', 'caramel', 'black'],
    colours: [colour(98, 79, 58), colour(190, 145, 87), colour(36, 34, 31)],
    distinguishing: 'Compact, stocky small goat with short legs and a broad body.',
    keywords: ['pygmy', 'small', 'mini', 'dwarf'],
  },
  {
    id: 'nigerian-dwarf',
    name: 'Nigerian Dwarf',
    type: 'dairy',
    origin: 'West Africa / United States',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [25, 35, 30, 40],
    colourPatterns: ['spotted', 'buckskin', 'chamoisee'],
    colours: [colour(196, 137, 82), colour(245, 241, 228), colour(52, 44, 38)],
    distinguishing: 'Small dairy goat with upright ears, balanced dairy shape, and many possible coat colours.',
    keywords: ['nigerian', 'dwarf', 'mini', 'dairy'],
  },
  {
    id: 'saanen',
    name: 'Saanen',
    type: 'dairy',
    origin: 'Switzerland',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [60, 80, 75, 100],
    colourPatterns: ['white', 'cream'],
    colours: [colour(248, 248, 238), colour(230, 225, 205)],
    distinguishing: 'Large white or cream dairy goat with upright ears and a calm, angular dairy build.',
    keywords: ['saanen', 'white', 'cream', 'dairy'],
  },
  {
    id: 'toggenburg',
    name: 'Toggenburg',
    type: 'dairy',
    origin: 'Switzerland',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short to medium',
    sizeKg: [45, 65, 60, 90],
    colourPatterns: ['brown with white facial stripes'],
    colours: [colour(116, 81, 49), colour(230, 220, 194)],
    distinguishing: 'Brown dairy goat with distinct pale facial stripes, pale lower legs, and upright ears.',
    keywords: ['toggenburg', 'brown', 'stripe', 'dairy'],
  },
  {
    id: 'alpine',
    name: 'Alpine',
    type: 'dairy',
    origin: 'French Alps',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [55, 75, 70, 100],
    colourPatterns: ['chamoisee', 'cou blanc', 'sundgau'],
    colours: [colour(168, 113, 65), colour(42, 35, 28), colour(235, 229, 210)],
    distinguishing: 'Medium-large dairy goat with upright ears and strong, often two-tone markings.',
    keywords: ['alpine', 'chamoisee', 'dairy'],
  },
  {
    id: 'la-mancha',
    name: 'LaMancha',
    type: 'dairy',
    origin: 'United States',
    earType: 'very short',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [55, 70, 70, 95],
    colourPatterns: ['any colour'],
    colours: [colour(200, 160, 108), colour(245, 240, 228), colour(55, 45, 36)],
    distinguishing: 'Dairy goat best known for tiny gopher or elf ears that look almost absent.',
    keywords: ['lamancha', 'la mancha', 'short ear', 'dairy'],
  },
  {
    id: 'angora',
    name: 'Angora',
    type: 'fiber',
    origin: 'Turkey',
    earType: 'pendulous',
    faceProfile: 'straight',
    coatTexture: 'long curly mohair',
    sizeKg: [35, 55, 55, 85],
    colourPatterns: ['white', 'coloured'],
    colours: [colour(240, 237, 224), colour(210, 202, 184)],
    distinguishing: 'Fiber goat with long, curly mohair fleece covering much of the body.',
    keywords: ['angora', 'mohair', 'fiber', 'wool', 'curly'],
  },
  {
    id: 'oberhasli',
    name: 'Oberhasli',
    type: 'dairy',
    origin: 'Switzerland',
    earType: 'upright',
    faceProfile: 'straight',
    coatTexture: 'short',
    sizeKg: [45, 65, 65, 90],
    colourPatterns: ['bay with black markings'],
    colours: [colour(168, 86, 38), colour(35, 28, 24)],
    distinguishing: 'Bay-red dairy goat with black belly, legs, dorsal stripe, and facial markings.',
    keywords: ['oberhasli', 'bay', 'red', 'black', 'dairy'],
  },
];

export const BREED_BY_ID = Object.fromEntries(BREEDS.map((breed) => [breed.id, breed]));

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function colourDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db) / 441.7;
}

export function analyseImageColours(source) {
  const canvas = source instanceof HTMLCanvasElement ? source : document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!(source instanceof HTMLCanvasElement)) {
    canvas.width = source.videoWidth || source.naturalWidth || source.width;
    canvas.height = source.videoHeight || source.naturalHeight || source.height;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return { dominant: colour(128, 128, 128), brightness: 0.5, whiteRatio: 0, darkRatio: 0, warmRatio: 0 };

  const sampleWidth = Math.min(96, width);
  const sampleHeight = Math.max(1, Math.round((height / width) * sampleWidth));
  const sample = document.createElement('canvas');
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  sampleCtx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);

  const data = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  let white = 0;
  let dark = 0;
  let warm = 0;

  for (let i = 0; i < data.length; i += 16) {
    const cr = data[i];
    const cg = data[i + 1];
    const cb = data[i + 2];
    const brightness = (cr + cg + cb) / 765;
    r += cr;
    g += cg;
    b += cb;
    count += 1;
    if (brightness > 0.78) white += 1;
    if (brightness < 0.22) dark += 1;
    if (cr > cb + 20 && cr > cg - 10) warm += 1;
  }

  return {
    dominant: colour(Math.round(r / count), Math.round(g / count), Math.round(b / count)),
    brightness: (r + g + b) / count / 765,
    whiteRatio: white / count,
    darkRatio: dark / count,
    warmRatio: warm / count,
  };
}

export function identifyBreed({ predictions = [], colourAnalysis = null, userRegion = '' } = {}) {
  const text = predictions.map((p) => `${p.className || ''} ${p.label || ''}`.toLowerCase()).join(' ');
  const candidates = BREEDS.map((breed) => {
    let score = breed.id === 'mixed' ? 0.08 : 0.12;

    for (const keyword of breed.keywords || []) {
      if (text.includes(keyword.toLowerCase())) score += 0.18;
    }

    if (colourAnalysis?.dominant && breed.colours?.length) {
      const bestColour = Math.min(...breed.colours.map((c) => colourDistance(colourAnalysis.dominant, c)));
      score += (1 - bestColour) * 0.28;
    }

    if (colourAnalysis?.whiteRatio > 0.35 && ['boer', 'kiko', 'saanen', 'angora'].includes(breed.id)) score += 0.12;
    if (colourAnalysis?.warmRatio > 0.35 && ['boer', 'nubian', 'toggenburg', 'oberhasli', 'alpine'].includes(breed.id)) score += 0.08;
    if (colourAnalysis?.darkRatio > 0.28 && ['pygmy', 'nigerian-dwarf', 'alpine'].includes(breed.id)) score += 0.06;
    if (userRegion === 'GH' && ['boer', 'nubian', 'kiko', 'pygmy', 'nigerian-dwarf'].includes(breed.id)) score += 0.03;

    return {
      id: breed.id,
      name: breed.name,
      confidence: clamp01(score),
      distinguishing: breed.distinguishing,
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const top = candidates.slice(0, 3);
  const total = top.reduce((sum, candidate) => sum + candidate.confidence, 0) || 1;
  const normalized = top.map((candidate) => ({ ...candidate, confidence: clamp01(candidate.confidence / total) }));

  return {
    best: normalized[0],
    alternatives: normalized.slice(1),
  };
}
