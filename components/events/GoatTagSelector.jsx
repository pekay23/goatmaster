'use client';
import React, { useMemo } from 'react';
import { Users, Search, X } from 'lucide-react';

export default function GoatTagSelector({ goats, selectedGoatIds, onToggle, onSelectGroup, onClear }) {
  const [goatSearchTerm, setGoatSearchTerm] = React.useState('');
  const [goatSexFilter, setGoatSexFilter] = React.useState('All');

  const goatById = useMemo(() => {
    const map = new Map();
    goats.forEach(g => map.set(g.id, g));
    return map;
  }, [goats]);

  const availableGoats = useMemo(() => {
    return goats.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(goatSearchTerm.toLowerCase()) ||
                          (g.ear_tag && g.ear_tag.toLowerCase().includes(goatSearchTerm.toLowerCase()));
      const matchSex = goatSexFilter === 'All' || g.sex === goatSexFilter;
      return matchSearch && matchSex;
    });
  }, [goats, goatSearchTerm, goatSexFilter]);

  return (
    <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} color="#6366f1" /> Tag Goats (Optional)
          </label>
          <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
            {selectedGoatIds.length === 0 ? 'No goats tagged (Farm-wide event)' : `${selectedGoatIds.length} goat${selectedGoatIds.length === 1 ? '' : 's'} tagged`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onSelectGroup('F')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ All Does</button>
          <button type="button" onClick={() => onSelectGroup('M')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ All Bucks</button>
          <button type="button" onClick={() => onSelectGroup('All')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ Tag All ({goats.length})</button>
          {selectedGoatIds.length > 0 && (
            <button type="button" onClick={onClear} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
          )}
        </div>
      </div>

      {selectedGoatIds.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 110, overflowY: 'auto', padding: 4 }}>
          {selectedGoatIds.map(gid => {
            const g = goatById.get(gid);
            if (!g) return null;
            return (
              <span key={gid} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid #6366f1', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                🐐 {g.name} {g.ear_tag ? `(${g.ear_tag})` : ''}
                <X size={14} color="#ef4444" style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => onToggle(gid)} />
              </span>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0, background: 'var(--bg-card)' }}>
          <Search size={14} color="var(--text-sub)" />
          <input className="search-input" placeholder="Search goats by name or ear tag..." value={goatSearchTerm}
            onChange={e => setGoatSearchTerm(e.target.value)} style={{ fontSize: 13 }} />
        </div>
        <select className="form-select" value={goatSexFilter} onChange={e => setGoatSexFilter(e.target.value)} style={{ width: 110, fontSize: 12, padding: '6px 8px' }}>
          <option value="All">All Sexes</option>
          <option value="F">Does (F)</option>
          <option value="M">Bucks (M)</option>
          <option value="W">Wethers (W)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
        {availableGoats.map(g => {
          const isSelected = selectedGoatIds.includes(g.id);
          return (
            <div key={g.id} onClick={() => onToggle(g.id)}
              style={{ padding: '6px 10px', borderRadius: 8, border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border-color)', background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', userSelect: 'none' }}>
              <span style={{ fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-sub)', marginLeft: 4 }}>{g.sex}</span>
            </div>
          );
        })}
        {availableGoats.length === 0 && (
          <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--text-sub)', textAlign: 'center', padding: 10 }}>No goats match search criteria.</div>
        )}
      </div>
    </div>
  );
}