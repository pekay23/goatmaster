'use client';
import React, { useState, useMemo } from 'react';
import { BREEDS } from '@/lib/breeds';
import { X, Search, Palette, BookOpen, Award } from 'lucide-react';
import BreedIdentifier from './BreedIdentifier';

const TYPE_COLORS = {
  dairy:     { bg: '#dbeafe', fg: '#1e40af', label: 'Dairy' },
  meat:      { bg: '#fee2e2', fg: '#991b1b', label: 'Meat' },
  fiber:     { bg: '#fef3c7', fg: '#92400e', label: 'Fiber' },
  dual:      { bg: '#e0e7ff', fg: '#3730a3', label: 'Dual-Purpose' },
  companion: { bg: '#f3e8ff', fg: '#6b21a8', label: 'Companion' },
};

const BreedCard = ({ breed, onClick }) => {
  const tc = TYPE_COLORS[breed.type] || TYPE_COLORS.dual;
  return (
    <div onClick={onClick} className="goat-card" style={{ cursor: 'pointer' }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐐</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{breed.name}</h3>
        <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {breed.origin}</div>
        <span style={{ fontSize: 10, background: tc.bg, color: tc.fg, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{tc.label}</span>
      </div>
    </div>
  );
};

const BreedDetailModal = ({ breed, onClose }) => {
  if (!breed) return null;
  const tc = TYPE_COLORS[breed.type] || TYPE_COLORS.dual;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20, animation: 'fadeIn 0.2s ease-out' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', animation: 'scaleIn 0.2s ease-out' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🐐</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{breed.name}</h2>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, background: tc.bg, color: tc.fg, padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>{tc.label}</span>
              <span style={{ fontSize: 11, background: 'var(--bg-app)', color: 'var(--text-sub)', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>📍 {breed.origin}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-app)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-sub)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>How to identify</div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>{breed.distinguishing}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FactBox label="Ear type" value={breed.earType} />
            <FactBox label="Face profile" value={breed.faceProfile} />
            <FactBox label="Coat" value={breed.coatTexture} />
            <FactBox label="Doe size" value={`${breed.sizeKg[0]}-${breed.sizeKg[1]} kg`} />
            <FactBox label="Buck size" value={`${breed.sizeKg[2]}-${breed.sizeKg[3]} kg`} />
            <FactBox label="Pattern" value={breed.colourPatterns.join(', ')} />
          </div>

          {breed.colours.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Palette size={11} /> Common colours
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {breed.colours.map((c, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: `rgb(${c.r},${c.g},${c.b})`, border: '2px solid var(--border-color)' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FactBox = ({ label, value }) => (
  <div style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: 10, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{value}</div>
  </div>
);

export default function BreedReference({ onClose }) {
  const [view, setView] = useState('identify'); // identify | library
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState(null);

  const filtered = useMemo(() => {
    return BREEDS.filter(b => {
      if (b.id === 'mixed') return false;
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.origin.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, typeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top bar with close button */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: 10, borderRadius: 12 }}>
          <span style={{ fontSize: 22 }}>📚</span>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Breeds</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Identify or browse {BREEDS.length - 1} breeds</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-sub)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setView('identify')} className={`btn-filter ${view === 'identify' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14, gap: 6, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
          <Award size={15} /> Identify
        </button>
        <button onClick={() => setView('library')} className={`btn-filter ${view === 'library' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14, gap: 6, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
          <BookOpen size={15} /> Library
        </button>
      </div>

      {view === 'identify' && <BreedIdentifier />}

      {view === 'library' && (
        <>
          <div className="search-bar">
            <Search size={18} color="var(--text-sub)" />
            <input className="search-input" placeholder="Search breeds…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              ['all',       'All'],
              ['dairy',     'Dairy'],
              ['meat',      'Meat'],
              ['fiber',     'Fiber'],
              ['dual',      'Dual'],
              ['companion', 'Pet'],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)} className={`btn-filter ${typeFilter === val ? 'active' : ''}`}>{label}</button>
            ))}
          </div>

          <div className="goat-grid">
            {filtered.map(b => <BreedCard key={b.id} breed={b} onClick={() => setSelectedBreed(b)} />)}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-state-icon">🔍</div>
                <h3>No breeds match</h3>
                <p>Try a different search or filter</p>
              </div>
            )}
          </div>
        </>
      )}

      <BreedDetailModal breed={selectedBreed} onClose={() => setSelectedBreed(null)} />

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
