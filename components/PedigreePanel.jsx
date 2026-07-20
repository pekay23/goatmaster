'use client';
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Dna, GitBranch } from 'lucide-react';

const MAX_GENERATIONS = 4;

function buildTree(goat, goatById, generation = 0, seen = new Set()) {
  if (!goat || generation > MAX_GENERATIONS || seen.has(String(goat.id))) return null;
  const nextSeen = new Set(seen);
  nextSeen.add(String(goat.id));

  return {
    ...goat,
    generation,
    dam: buildTree(goatById.get(String(goat.dam_id)), goatById, generation + 1, nextSeen),
    sire: buildTree(goatById.get(String(goat.sire_id)), goatById, generation + 1, nextSeen),
  };
}

function collectAncestors(goatId, goatById) {
  const ancestors = new Map();

  function walk(id, depth, path) {
    if (!id || depth > MAX_GENERATIONS || path.has(String(id))) return;
    const goat = goatById.get(String(id));
    if (!goat) return;

    const key = String(goat.id);
    const existing = ancestors.get(key);
    if (!existing || depth < existing.depth) ancestors.set(key, { goat, depth });

    const nextPath = new Set(path);
    nextPath.add(key);
    walk(goat.dam_id, depth + 1, nextPath);
    walk(goat.sire_id, depth + 1, nextPath);
  }

  const goat = goatById.get(String(goatId));
  if (!goat) return ancestors;
  walk(goat.dam_id, 1, new Set([String(goatId)]));
  walk(goat.sire_id, 1, new Set([String(goatId)]));
  return ancestors;
}

function getRelationship(goat, goatById) {
  if (!goat?.dam_id || !goat?.sire_id) return null;
  const damAncestors = collectAncestors(goat.dam_id, goatById);
  const sireAncestors = collectAncestors(goat.sire_id, goatById);
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
  return commonAncestors.length ? { commonAncestors, estimatedCoi } : null;
}

function PedigreeNode({ node, label }) {
  if (!node) {
    return (
      <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-app)', border: '1px dashed var(--border-color)', color: 'var(--text-sub)', fontSize: 13 }}>
        {label}: Unknown
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="glass-panel" style={{ padding: 14, borderRadius: 12, borderLeft: `4px solid ${node.sex === 'M' ? '#3b82f6' : '#e91e63'}` }}>
        <div style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 16, color: 'var(--text-main)', fontWeight: 800, marginTop: 3 }}>{node.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 3 }}>
          {[node.breed, node.ear_tag].filter(Boolean).join(' · ') || node.sex || 'Unknown'}
        </div>
      </div>
      {node.generation < MAX_GENERATIONS && (node.dam || node.sire) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, paddingLeft: 12, borderLeft: '1px solid var(--border-color)' }}>
          <PedigreeNode node={node.dam} label="Dam" />
          <PedigreeNode node={node.sire} label="Sire" />
        </div>
      )}
    </div>
  );
}

export default function PedigreePanel({ goats = [] }) {
  const [selectedGoatId, setSelectedGoatId] = useState('');
  const goatById = useMemo(() => new Map(goats.map(goat => [String(goat.id), goat])), [goats]);
  const selectedGoat = selectedGoatId ? goatById.get(String(selectedGoatId)) : null;
  const tree = useMemo(() => buildTree(selectedGoat, goatById), [goatById, selectedGoat]);
  const relationship = useMemo(() => getRelationship(selectedGoat, goatById), [goatById, selectedGoat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: 'var(--primary-bg)', padding: 10, borderRadius: 12 }}>
          <GitBranch size={22} color="var(--primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-main)' }}>Pedigree Tree</h3>
          <p style={{ margin: '3px 0 0', color: 'var(--text-sub)', fontSize: 12 }}>Four-generation ancestry</p>
        </div>
      </div>

      <select className="form-select" value={selectedGoatId} onChange={e => setSelectedGoatId(e.target.value)}>
        <option value="">Select goat</option>
        {goats.map(goat => <option key={goat.id} value={goat.id}>{goat.name}</option>)}
      </select>

      {relationship && (
        <div style={{ padding: 14, background: '#fff3cd', border: '1px solid #f59e0b', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>Pedigree overlap detected</div>
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.45, marginTop: 4 }}>
              {relationship.commonAncestors[0].name} appears on both sides. Estimated COI {(relationship.estimatedCoi * 100).toFixed(1)}%.
            </div>
          </div>
        </div>
      )}

      {!selectedGoat ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <Dna size={36} color="var(--text-sub)" />
          <h3>No goat selected</h3>
          <p>Select a goat to view recorded ancestry.</p>
        </div>
      ) : (
        <PedigreeNode node={tree} label="Goat" />
      )}
    </div>
  );
}
