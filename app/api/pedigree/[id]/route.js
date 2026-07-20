import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_GENERATIONS = 4;

function toPedigreeNode(goat, goatById, generation = 0, seen = new Set()) {
  if (!goat || generation > MAX_GENERATIONS || seen.has(goat.id)) return null;

  const nextSeen = new Set(seen);
  nextSeen.add(goat.id);

  return {
    id: goat.id,
    name: goat.name,
    breed: goat.breed,
    sex: goat.sex,
    dob: goat.dob,
    ear_tag: goat.ear_tag,
    generation,
    dam: toPedigreeNode(goatById.get(goat.dam_id), goatById, generation + 1, nextSeen),
    sire: toPedigreeNode(goatById.get(goat.sire_id), goatById, generation + 1, nextSeen),
  };
}

function collectAncestors(goatId, goatById, maxDepth = MAX_GENERATIONS) {
  const ancestors = new Map();

  function walk(id, depth, path) {
    if (!id || depth > maxDepth || path.has(id)) return;
    const goat = goatById.get(id);
    if (!goat) return;

    const existing = ancestors.get(id);
    if (!existing || depth < existing.depth) {
      ancestors.set(id, { goat, depth });
    }

    const nextPath = new Set(path);
    nextPath.add(id);
    walk(goat.dam_id, depth + 1, nextPath);
    walk(goat.sire_id, depth + 1, nextPath);
  }

  const goat = goatById.get(goatId);
  if (!goat) return ancestors;
  walk(goat.dam_id, 1, new Set([goatId]));
  walk(goat.sire_id, 1, new Set([goatId]));
  return ancestors;
}

function calculateRelationship(damId, sireId, goatById) {
  if (!damId || !sireId) {
    return { isRelated: false, commonAncestors: [], estimatedCoi: 0 };
  }

  const damAncestors = collectAncestors(damId, goatById);
  const sireAncestors = collectAncestors(sireId, goatById);
  const commonAncestors = [];
  let estimatedCoi = 0;

  for (const [ancestorId, damSide] of damAncestors.entries()) {
    const sireSide = sireAncestors.get(ancestorId);
    if (!sireSide) continue;

    const contribution = Math.pow(0.5, damSide.depth + sireSide.depth + 1);
    estimatedCoi += contribution;
    commonAncestors.push({
      id: ancestorId,
      name: damSide.goat.name,
      damDepth: damSide.depth,
      sireDepth: sireSide.depth,
      contribution,
    });
  }

  commonAncestors.sort((a, b) => (a.damDepth + a.sireDepth) - (b.damDepth + b.sireDepth));
  return {
    isRelated: commonAncestors.length > 0,
    commonAncestors,
    estimatedCoi,
  };
}

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT id, name, breed, sex, dob, ear_tag, dam_id, sire_id
       FROM goats
       WHERE owner_id = $1`,
      [user.sub]
    );

    const goatById = new Map(rows.map(goat => [goat.id, goat]));
    const goat = goatById.get(id);
    if (!goat) return NextResponse.json({ error: 'Goat not found or unauthorized' }, { status: 404 });

    return NextResponse.json({
      goat: toPedigreeNode(goat, goatById),
      relationship: calculateRelationship(goat.dam_id, goat.sire_id, goatById),
    });
  } catch (error) {
    console.error('Error fetching pedigree:', error);
    return NextResponse.json({ error: 'Failed to fetch pedigree' }, { status: 500 });
  }
}
