/**
 * Comprehensive Goat Breed Knowledge Base
 *
 * Each breed has:
 *   - id, name, origin, type (dairy|meat|fiber|dual|companion)
 *   - colours: array of {r,g,b} reference points (for centroid matching)
 *   - colourPatterns: 'solid' | 'bicolour' | 'multi' | 'patterned' | 'spotted'
 *   - earType: 'erect' | 'pendulous' | 'lop' | 'tiny' | 'medium'
 *   - faceProfile: 'straight' | 'dished' | 'roman' | 'convex'
 *   - sizeKg: [doeKgMin, doeKgMax, buckKgMin, buckKgMax]
 *   - coatTexture: 'short' | 'medium' | 'long' | 'fleece' | 'wool'
 *   - keywords: ImageNet-derived hints
 *   - distinguishing: human-readable identifying features
 *   - regions: [country codes]
 *
 * Sources synthesised from Wikipedia, Britannica, Oklahoma State University
 * Breeds of Livestock, Goat Journal, ScienceDirect, American Goat Society,
 * Carefree Goats Breed Chart, and West African Dwarf Goat research.
 */

export const BREEDS = [
  // ── DAIRY BREEDS ────────────────────────────────────────────────
  {
    id: 'saanen', name: 'Saanen', origin: 'Switzerland', type: 'dairy',
    colours: [{ r: 245, g: 245, b: 240 }],
    colourPatterns: ['solid'],
    earType: 'erect', faceProfile: 'straight',
    sizeKg: [60, 80, 80, 100], coatTexture: 'short',
    keywords: ['white', 'goat'],
    distinguishing: 'Pure white short coat, erect medium ears pointing forward, large frame. The "Holstein of goats". One of the heaviest milk producers.',
    regions: ['CH', 'global'],
  },
  {
    id: 'sable', name: 'Sable', origin: 'USA (Saanen variant)', type: 'dairy',
    colours: [{ r: 110, g: 80, b: 60 }, { r: 80, g: 60, b: 50 }, { r: 200, g: 180, b: 160 }],
    colourPatterns: ['solid', 'multi'],
    earType: 'erect', faceProfile: 'straight',
    sizeKg: [60, 80, 80, 100], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Same conformation as Saanen but any colour other than white — fawn, red, brown, black or spotted.',
    regions: ['US', 'global'],
  },
  {
    id: 'alpine', name: 'Alpine', origin: 'French Alps', type: 'dairy',
    colours: [{ r: 90, g: 70, b: 60 }, { r: 200, g: 180, b: 160 }, { r: 30, g: 25, b: 25 }],
    colourPatterns: ['multi', 'patterned'],
    earType: 'erect', faceProfile: 'straight',
    sizeKg: [60, 75, 75, 90], coatTexture: 'short',
    keywords: ['mountain goat', 'chamois', 'ibex'],
    distinguishing: 'Highly varied colour — cou blanc (white neck), cou clair (light neck), cou noir (black front, white rear), chamoisee. Erect ears, dished face, hardy and active.',
    regions: ['FR', 'global'],
  },
  {
    id: 'oberhasli', name: 'Oberhasli', origin: 'Switzerland', type: 'dairy',
    colours: [{ r: 145, g: 80, b: 50 }, { r: 30, g: 20, b: 20 }],
    colourPatterns: ['patterned'],
    earType: 'erect', faceProfile: 'dished',
    sizeKg: [55, 70, 70, 85], coatTexture: 'short',
    keywords: ['deer', 'goat'],
    distinguishing: 'Reddish-bay body with black face stripes from eye to muzzle, black dorsal stripe, black belly and lower legs. Erect ears point forward.',
    regions: ['CH', 'US'],
  },
  {
    id: 'toggenburg', name: 'Toggenburg', origin: 'Switzerland', type: 'dairy',
    colours: [{ r: 130, g: 100, b: 75 }, { r: 220, g: 210, b: 200 }],
    colourPatterns: ['patterned'],
    earType: 'erect', faceProfile: 'dished',
    sizeKg: [50, 65, 65, 80], coatTexture: 'medium',
    keywords: ['goat'],
    distinguishing: 'Light fawn to dark chocolate body with two distinctive WHITE stripes from muzzle to eyes ("badger face"), white ears with dark spot, white legs and rump. Oldest registered breed (1600s).',
    regions: ['CH', 'global'],
  },
  {
    id: 'nubian', name: 'Nubian (Anglo-Nubian)', origin: 'England/Africa', type: 'dairy',
    colours: [{ r: 140, g: 95, b: 60 }, { r: 30, g: 25, b: 25 }, { r: 180, g: 140, b: 100 }],
    colourPatterns: ['solid', 'multi', 'spotted'],
    earType: 'pendulous', faceProfile: 'roman',
    sizeKg: [60, 80, 80, 100], coatTexture: 'short',
    keywords: ['deer', 'spaniel', 'goat'],
    distinguishing: 'Long PENDULOUS bell-shaped ears hanging close to head, distinctive ROMAN/convex nose. Many colours: tan, red, black, often spotted. Vocal personality. High butterfat milk.',
    regions: ['GB', 'AF', 'US', 'global'],
  },
  {
    id: 'lamancha', name: 'LaMancha', origin: 'USA (Oregon)', type: 'dairy',
    colours: [{ r: 80, g: 60, b: 50 }, { r: 200, g: 180, b: 160 }, { r: 30, g: 25, b: 25 }],
    colourPatterns: ['multi', 'spotted'],
    earType: 'tiny', faceProfile: 'straight',
    sizeKg: [60, 75, 70, 85], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Almost no external ears — "gopher" (no cartilage, <1 inch) or "elf" (small, <2 inches). Any colour. Calm, friendly. Uniquely American breed.',
    regions: ['US'],
  },
  {
    id: 'nigerian-dwarf', name: 'Nigerian Dwarf', origin: 'West Africa / USA', type: 'dairy',
    colours: [{ r: 30, g: 25, b: 25 }, { r: 110, g: 80, b: 60 }, { r: 200, g: 170, b: 120 }],
    colourPatterns: ['multi', 'spotted', 'solid'],
    earType: 'erect', faceProfile: 'straight',
    sizeKg: [27, 35, 30, 38], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Miniature dairy goat — does ≤57cm at withers. Erect ears, straight nose, dairy proportions in miniature. Black, chocolate, gold are main colours; white markings common. High butterfat (6-10%) milk.',
    regions: ['US', 'global'],
  },

  // ── MEAT BREEDS ─────────────────────────────────────────────────
  {
    id: 'boer', name: 'Boer', origin: 'South Africa', type: 'meat',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 150, g: 75, b: 45 }, { r: 110, g: 55, b: 35 }],
    colourPatterns: ['bicolour'],
    earType: 'lop', faceProfile: 'roman',
    sizeKg: [90, 110, 110, 160], coatTexture: 'short',
    keywords: ['goat', 'ibex'],
    distinguishing: 'WHITE body with distinctive RED/BROWN head (sometimes full red). Large floppy "lop" ears. Roman nose. Heavy muscling — bucks reach 160kg. Gold standard for meat production.',
    regions: ['ZA', 'global'],
  },
  {
    id: 'kiko', name: 'Kiko', origin: 'New Zealand', type: 'meat',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 90, g: 70, b: 60 }, { r: 140, g: 100, b: 70 }],
    colourPatterns: ['solid', 'multi'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [55, 80, 80, 120], coatTexture: 'medium',
    keywords: ['goat'],
    distinguishing: 'White is most common but any colour. Hardy, large-framed, semi-pendulous medium ears. Bred for parasite resistance and forage efficiency on rough terrain.',
    regions: ['NZ', 'US'],
  },
  {
    id: 'spanish', name: 'Spanish (Brush)', origin: 'Spain → Americas', type: 'meat',
    colours: [{ r: 30, g: 25, b: 25 }, { r: 110, g: 80, b: 60 }, { r: 200, g: 180, b: 160 }],
    colourPatterns: ['multi', 'spotted'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [40, 55, 55, 90], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Highly variable in colour, medium ears slightly pendulous, agile and tough. Excellent browser — nicknamed "brush goat" for clearing vegetation.',
    regions: ['ES', 'US', 'MX'],
  },
  {
    id: 'savanna', name: 'Savanna', origin: 'South Africa', type: 'meat',
    colours: [{ r: 240, g: 235, b: 225 }],
    colourPatterns: ['solid'],
    earType: 'lop', faceProfile: 'roman',
    sizeKg: [60, 90, 90, 120], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'PURE WHITE coat with BLACK SKIN, horns, hooves. Heat and parasite tolerant. Roman nose, lop ears similar to Boer.',
    regions: ['ZA', 'global'],
  },
  {
    id: 'kalahari-red', name: 'Kalahari Red', origin: 'South Africa / Namibia', type: 'meat',
    colours: [{ r: 145, g: 75, b: 50 }, { r: 180, g: 100, b: 70 }],
    colourPatterns: ['solid'],
    earType: 'lop', faceProfile: 'roman',
    sizeKg: [75, 100, 100, 140], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Solid red/copper coat (camouflage in arid regions). Lop ears, roman nose, heavy build. Heat and drought tolerant.',
    regions: ['ZA', 'NA'],
  },
  {
    id: 'myotonic', name: 'Myotonic (Fainting)', origin: 'USA (Tennessee)', type: 'meat',
    colours: [{ r: 30, g: 25, b: 25 }, { r: 240, g: 235, b: 225 }, { r: 110, g: 80, b: 60 }],
    colourPatterns: ['multi', 'bicolour', 'spotted'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [27, 50, 45, 80], coatTexture: 'medium',
    keywords: ['goat'],
    distinguishing: 'Stiffens and falls when startled (myotonia). Ears point forward, often black & white. Heavily muscled for size.',
    regions: ['US'],
  },

  // ── AFRICAN INDIGENOUS BREEDS (highly relevant for Ghana) ────────
  {
    id: 'west-african-dwarf', name: 'West African Dwarf (Djallonké)', origin: 'West & Central Africa', type: 'dual',
    colours: [{ r: 30, g: 25, b: 25 }, { r: 240, g: 235, b: 225 }, { r: 145, g: 80, b: 50 }, { r: 180, g: 140, b: 90 }],
    colourPatterns: ['multi', 'spotted', 'patterned'],
    earType: 'erect', faceProfile: 'straight',
    sizeKg: [18, 25, 22, 32], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Small (35-50cm), short legs, varied colours from solid to spotted. Erect ears, straight face. Trypanotolerant — resists tsetse-fly disease. Native to humid coastal West Africa including Ghana. Includes Ghan Forest type.',
    regions: ['GH', 'NG', 'CI', 'TG', 'BJ', 'CM', 'WAF'],
  },
  {
    id: 'sahel', name: 'Sahel (Sahelian)', origin: 'Sahel Belt, West Africa', type: 'dual',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 110, g: 80, b: 60 }, { r: 30, g: 25, b: 25 }, { r: 145, g: 80, b: 50 }],
    colourPatterns: ['multi', 'patterned'],
    earType: 'pendulous', faceProfile: 'straight',
    sizeKg: [25, 40, 35, 60], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'TALL and lean (60-75cm) with long thin legs. Long pendulous ears, narrow head. Adapted to arid Sahel — Mali, Senegal, Niger, northern Nigeria/Ghana. Many colours.',
    regions: ['ML', 'SN', 'NE', 'NG', 'BF', 'GH-N'],
  },
  {
    id: 'sokoto-red', name: 'Sokoto Red (Maradi)', origin: 'Niger / Northern Nigeria', type: 'dual',
    colours: [{ r: 150, g: 70, b: 45 }, { r: 175, g: 90, b: 55 }],
    colourPatterns: ['solid'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [25, 35, 30, 45], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'SOLID DEEP RED/MAHOGANY coat. Glossy short hair, medium erect ears. Famous for high-quality skin (used in Moroccan leather). Native to Sahel region.',
    regions: ['NE', 'NG-N'],
  },

  // ── FIBER BREEDS ────────────────────────────────────────────────
  {
    id: 'angora', name: 'Angora', origin: 'Turkey (Ankara)', type: 'fiber',
    colours: [{ r: 245, g: 240, b: 230 }],
    colourPatterns: ['solid'],
    earType: 'pendulous', faceProfile: 'straight',
    sizeKg: [30, 50, 45, 80], coatTexture: 'fleece',
    keywords: ['wool', 'angora', 'fleece'],
    distinguishing: 'Long curly white MOHAIR fleece covering entire body — unmistakable. Pendulous ears, spiral horns. Sheared twice yearly producing 2-5kg of mohair.',
    regions: ['TR', 'ZA', 'US', 'global'],
  },
  {
    id: 'cashmere', name: 'Cashmere', origin: 'Asia / Australia', type: 'fiber',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 110, g: 80, b: 60 }, { r: 30, g: 25, b: 25 }],
    colourPatterns: ['solid', 'multi'],
    earType: 'medium', faceProfile: 'roman',
    sizeKg: [35, 55, 55, 90], coatTexture: 'long',
    keywords: ['wool', 'fleece'],
    distinguishing: 'Dual coat: coarse outer guard hair + fine cashmere down underneath. Roman nose, downturned ears. Cashmere is combed/sheared from belly and flanks.',
    regions: ['CN', 'MN', 'AU', 'NZ', 'IR'],
  },
  {
    id: 'pygora', name: 'Pygora', origin: 'USA', type: 'fiber',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 30, g: 25, b: 25 }, { r: 110, g: 80, b: 60 }],
    colourPatterns: ['multi', 'solid'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [27, 36, 32, 45], coatTexture: 'fleece',
    keywords: ['wool', 'fleece', 'goat'],
    distinguishing: 'Pygmy × Angora cross. Small with long fleece in cashmere-like, mohair-like, or blend. Many colours.',
    regions: ['US'],
  },

  // ── COMPANION / SMALL BREEDS ────────────────────────────────────
  {
    id: 'pygmy', name: 'Pygmy', origin: 'West Africa / USA', type: 'companion',
    colours: [{ r: 110, g: 80, b: 60 }, { r: 30, g: 25, b: 25 }, { r: 200, g: 180, b: 150 }],
    colourPatterns: ['multi', 'patterned'],
    earType: 'erect', faceProfile: 'dished',
    sizeKg: [24, 35, 27, 39], coatTexture: 'medium',
    keywords: ['goat'],
    distinguishing: 'Cobby, barrel-shaped, heavy-boned. Short legs, dished face, erect ears. Caramel/agouti pattern with darker face/legs. Common in petting zoos.',
    regions: ['US', 'global'],
  },
  {
    id: 'mini-nubian', name: 'Mini Nubian', origin: 'USA', type: 'dairy',
    colours: [{ r: 140, g: 95, b: 60 }, { r: 30, g: 25, b: 25 }],
    colourPatterns: ['solid', 'spotted'],
    earType: 'pendulous', faceProfile: 'roman',
    sizeKg: [27, 40, 32, 50], coatTexture: 'short',
    keywords: ['goat', 'deer'],
    distinguishing: 'Nigerian Dwarf × Nubian cross. Pendulous ears and roman nose like Nubian, but compact size. High butterfat milk in small package.',
    regions: ['US'],
  },

  // ── INDIGENOUS / OTHER ──────────────────────────────────────────
  {
    id: 'jamunapari', name: 'Jamunapari', origin: 'India', type: 'dual',
    colours: [{ r: 240, g: 235, b: 225 }, { r: 200, g: 180, b: 160 }],
    colourPatterns: ['solid', 'patterned'],
    earType: 'pendulous', faceProfile: 'roman',
    sizeKg: [50, 70, 70, 90], coatTexture: 'medium',
    keywords: ['goat'],
    distinguishing: 'Tall, white with tan/brown patches, distinct ROMAN nose, very long pendulous ears. Tasselled tail. Influence on Anglo-Nubian breed.',
    regions: ['IN'],
  },
  {
    id: 'beetal', name: 'Beetal', origin: 'India / Pakistan', type: 'dual',
    colours: [{ r: 30, g: 25, b: 25 }, { r: 145, g: 80, b: 50 }, { r: 240, g: 235, b: 225 }],
    colourPatterns: ['multi', 'spotted'],
    earType: 'pendulous', faceProfile: 'roman',
    sizeKg: [40, 60, 60, 80], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Black, brown or pied. Roman nose, large pendulous ears. Common in South Asia.',
    regions: ['IN', 'PK'],
  },
  {
    id: 'sirohi', name: 'Sirohi', origin: 'India (Rajasthan)', type: 'meat',
    colours: [{ r: 145, g: 80, b: 50 }, { r: 240, g: 235, b: 225 }],
    colourPatterns: ['multi', 'patterned'],
    earType: 'medium', faceProfile: 'roman',
    sizeKg: [25, 35, 35, 50], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Light brown body with darker brown patches, roman nose. Small twisted horns. Heat-tolerant Indian breed.',
    regions: ['IN'],
  },
  {
    id: 'black-bengal', name: 'Black Bengal', origin: 'Bangladesh / India', type: 'meat',
    colours: [{ r: 30, g: 25, b: 25 }],
    colourPatterns: ['solid'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [15, 25, 18, 30], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Small, all-black coat (sometimes brown/grey), short erect ears. Famous for tender meat and high-quality skin. Exceptionally prolific (twins/triplets).',
    regions: ['BD', 'IN'],
  },

  // ── FALLBACK ────────────────────────────────────────────────────
  {
    id: 'mixed', name: 'Mixed / Crossbreed', origin: 'Various', type: 'dual',
    colours: [],
    colourPatterns: ['multi', 'patterned', 'spotted'],
    earType: 'medium', faceProfile: 'straight',
    sizeKg: [25, 60, 30, 80], coatTexture: 'short',
    keywords: ['goat'],
    distinguishing: 'Crossbred or unidentified breed. Edit profile to set the correct breed.',
    regions: ['global'],
  },
];

export const BREED_BY_ID = Object.fromEntries(BREEDS.map(b => [b.id, b]));
export const BREED_NAMES = BREEDS.map(b => b.name);

// ── COLOUR ANALYSIS ──────────────────────────────────────────────

/**
 * Sample dominant colours from the centre of an image (where the goat usually is).
 * Returns { palette: [{r,g,b,weight}], whiteRatio, blackRatio, redRatio, brownRatio }
 */
export function analyseImageColours(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  // Sample only the centre 60% × 60% — avoids background bias
  const cx = Math.floor(w * 0.2), cy = Math.floor(h * 0.2);
  const cw = Math.floor(w * 0.6), ch = Math.floor(h * 0.6);
  const data = ctx.getImageData(cx, cy, cw, ch).data;

  let total = 0;
  let whiteRatio = 0, blackRatio = 0, redRatio = 0, brownRatio = 0, tanRatio = 0;
  // K-means-lite — simple bucketing into 16 colour bins
  const bins = {};

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];

    // Ratios
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b);
    if (lum > 200 && (max - min) < 30)        whiteRatio++;
    else if (lum < 60)                         blackRatio++;
    else if (r > g + 30 && r > b + 30 && r > 110 && r < 200)  redRatio++;
    else if (r > g && g > b && r - b > 30 && lum < 150)        brownRatio++;
    else if (r > 150 && g > 130 && b < 130)   tanRatio++;
    total++;

    // Bucket: quantise to 64-step grid (4 bits per channel)
    const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
    bins[key] = (bins[key] || 0) + 1;
  }

  // Top 5 colours
  const palette = Object.entries(bins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const k = parseInt(key);
      return {
        r: ((k >> 8) & 0xF) << 4 | 8,
        g: ((k >> 4) & 0xF) << 4 | 8,
        b: (k & 0xF) << 4 | 8,
        weight: count / total,
      };
    });

  return {
    palette,
    whiteRatio: whiteRatio / total,
    blackRatio: blackRatio / total,
    redRatio:   redRatio / total,
    brownRatio: brownRatio / total,
    tanRatio:   tanRatio / total,
  };
}

/**
 * Score how well an image's colour profile matches a breed.
 * Higher = better match. Range roughly 0-1.
 */
function scoreColourMatch(breed, colourAnalysis) {
  const { whiteRatio, blackRatio, redRatio, brownRatio, tanRatio, palette } = colourAnalysis;
  let score = 0;

  // Colour ratio heuristics by breed id
  switch (breed.id) {
    case 'saanen':
      score = whiteRatio * 1.5 - (redRatio + brownRatio + blackRatio) * 0.5;
      break;
    case 'savanna':
      score = whiteRatio * 1.4 - redRatio * 0.3;
      break;
    case 'sokoto-red':
    case 'kalahari-red':
      score = redRatio * 1.6 - whiteRatio * 0.5;
      break;
    case 'boer':
      // Bicolour — needs both white body AND red/brown head
      score = (Math.min(whiteRatio, 0.5) * 1.5) + (Math.min(redRatio + brownRatio, 0.4) * 1.2) - blackRatio;
      break;
    case 'angora':
    case 'pygora':
      score = whiteRatio * 1.0; // Texture detection elsewhere boosts these
      break;
    case 'oberhasli':
      score = redRatio * 1.0 + brownRatio * 0.8 + blackRatio * 0.4;
      break;
    case 'toggenburg':
      score = brownRatio * 1.0 + tanRatio * 0.6 - whiteRatio * 0.2;
      break;
    case 'black-bengal':
      score = blackRatio * 1.5;
      break;
    case 'nubian':
    case 'jamunapari':
    case 'beetal':
    case 'sahel':
      score = (redRatio + brownRatio + tanRatio) * 0.6 + Math.min(whiteRatio, 0.3) * 0.4;
      break;
    case 'alpine':
    case 'spanish':
    case 'pygmy':
    case 'myotonic':
    case 'lamancha':
    case 'kiko':
    case 'west-african-dwarf':
    case 'nigerian-dwarf':
      // Mixed / variable — score on diversity (no single colour dominates)
      const dominant = Math.max(whiteRatio, blackRatio, redRatio, brownRatio, tanRatio);
      score = (1 - dominant) * 0.5 + 0.2;
      break;
    case 'mixed':
      score = 0.05; // Fallback — almost always last
      break;
    default:
      score = 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Score how well ImageNet predictions support a breed.
 */
function scoreKeywordMatch(breed, predictions) {
  if (!predictions || !breed.keywords?.length) return 0;
  let bestProb = 0;
  for (const pred of predictions) {
    const cls = pred.className.toLowerCase();
    for (const kw of breed.keywords) {
      if (cls.includes(kw)) {
        bestProb = Math.max(bestProb, pred.probability);
      }
    }
  }
  return bestProb;
}

/**
 * Region preference — adds slight boost to breeds common in the user's region.
 */
function scoreRegionMatch(breed, userRegion) {
  if (!userRegion || !breed.regions?.length) return 0;
  if (breed.regions.includes(userRegion)) return 0.15;
  if (breed.regions.includes(userRegion.split('-')[0])) return 0.1;
  if (breed.regions.includes('global')) return 0.05;
  return 0;
}

/**
 * Combined breed prediction.
 * Returns top 3 breeds with confidence scores.
 *
 * @param {{predictions, colourAnalysis, userRegion?}} input
 */
export function identifyBreed({ predictions, colourAnalysis, userRegion = 'GH' }) {
  const scores = BREEDS.map(breed => {
    const colourScore  = scoreColourMatch(breed, colourAnalysis);
    const keywordScore = scoreKeywordMatch(breed, predictions);
    const regionScore  = scoreRegionMatch(breed, userRegion);

    // Weighted combination — colour is the strongest signal we have
    const total = (colourScore * 0.6) + (keywordScore * 0.3) + (regionScore * 0.1);

    return { breed, score: total, parts: { colourScore, keywordScore, regionScore } };
  });

  scores.sort((a, b) => b.score - a.score);
  const top3 = scores.slice(0, 3).map(s => ({
    id: s.breed.id,
    name: s.breed.name,
    confidence: s.score,
    type: s.breed.type,
    distinguishing: s.breed.distinguishing,
  }));

  return {
    best: top3[0],
    alternatives: top3.slice(1),
    breed: top3[0].name, // backwards-compat string
    confidence: top3[0].confidence,
  };
}
