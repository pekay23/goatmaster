'use client';
import React, { useMemo, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Edit2, Trash2, Package } from 'lucide-react';
import { CATEGORY_COLORS, PRESET_CATEGORIES, ITEMS_PER_PAGE } from './constants';
import { extractKeywords } from './utils';

export default function EventTimeline({ farmEvents, goats, isLoading, onEdit, onDelete, activeKeywordFilter, onKeywordFilter, categoryFilter, onCategoryFilter, selectedGoatFilter, onGoatFilter, searchTerm, onSearch }) {
  const [currentPage, setCurrentPage] = useState(1);

  const goatById = useMemo(() => {
    const map = new Map(); goats.forEach(g => map.set(g.id, g)); return map;
  }, [goats]);

  const filteredEvents = useMemo(() => {
    let result = [...farmEvents];
    result.sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0));

    if (activeKeywordFilter) {
      const kw = activeKeywordFilter.toLowerCase();
      result = result.filter(e =>
        (e.keywords && e.keywords.some(k => k.toLowerCase() === kw)) ||
        (e.subject && e.subject.toLowerCase().includes(kw))
      );
    }
    if (categoryFilter !== 'All') result = result.filter(e => e.category === categoryFilter);
    if (selectedGoatFilter !== 'All') {
      if (['F', 'M', 'W'].includes(selectedGoatFilter)) {
        result = result.filter(e => Array.isArray(e.goat_ids) && e.goat_ids.some(gid => {
          const g = goatById.get(gid); return g && g.sex === selectedGoatFilter;
        }));
      } else {
        result = result.filter(e => Array.isArray(e.goat_ids) && e.goat_ids.includes(selectedGoatFilter));
      }
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(term) ||
        (e.details && e.details.toLowerCase().includes(term)) ||
        (e.category && e.category.toLowerCase().includes(term)) ||
        (e.keywords && e.keywords.some(k => k.toLowerCase().includes(term)))
      );
    }
    return result;
  }, [farmEvents, activeKeywordFilter, categoryFilter, selectedGoatFilter, searchTerm, goatById]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-panel" style={{ padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="search-bar" style={{ marginBottom: 0, background: 'var(--bg-app)' }}>
          <Search size={16} color="var(--text-sub)" />
          <input className="search-input" placeholder="Search event title, details, keywords..." value={searchTerm}
            onChange={e => { onSearch(e.target.value); setCurrentPage(1); }} style={{ fontSize: 14 }} />
          {searchTerm && <X size={14} color="var(--text-sub)" style={{ cursor: 'pointer' }} onClick={() => { onSearch(''); setCurrentPage(1); }} />}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" value={categoryFilter}
            onChange={e => { onCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1, minWidth: 120, fontSize: 12, padding: '7px 10px' }}>
            <option value="All">All Categories</option>
            {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="form-select" value={selectedGoatFilter}
            onChange={e => { onGoatFilter(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1, minWidth: 140, fontSize: 12, padding: '7px 10px' }}>
            <option value="All">All Goats (Herd & Farm)</option>
            <optgroup label="── Sex Category ──">
              <option value="F">Does (Females)</option>
              <option value="M">Bucks (Males)</option>
              <option value="W">Wethers (Castrated)</option>
            </optgroup>
            <optgroup label="── Specific Goat ──">
              {goats.map(g => <option key={g.id} value={g.id}>{g.name} {g.ear_tag ? `(${g.ear_tag})` : ''}</option>)}
            </optgroup>
          </select>

          {activeKeywordFilter && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 14, background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              #{activeKeywordFilter}
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => { onKeywordFilter(''); setCurrentPage(1); }} />
            </span>
          )}

          {(searchTerm || categoryFilter !== 'All' || selectedGoatFilter !== 'All' || activeKeywordFilter) && (
            <button onClick={() => { onSearch(''); onCategoryFilter('All'); onGoatFilter('All'); onKeywordFilter(''); setCurrentPage(1); }}
              style={{ fontSize: 12, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>Loading farm events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">🗓️</div>
          <h3>No farm events found</h3>
          <p>{searchTerm || categoryFilter !== 'All' || selectedGoatFilter !== 'All' || activeKeywordFilter
            ? 'No events match your current filter selection.'
            : 'Start logging events like treatments, feedings, repairs, or observations to build your farm record.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginatedEvents.map(evt => {
            const catColor = CATEGORY_COLORS[evt.category] || '#6366f1';
            const taggedIds = Array.isArray(evt.goat_ids) ? evt.goat_ids : [];
            const keywords = (Array.isArray(evt.keywords) && evt.keywords.length > 0) ? evt.keywords : extractKeywords(evt.subject);

            return (
              <div key={evt.id} className="glass-panel" style={{ padding: '16px 18px', borderLeft: `4px solid ${catColor}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 800, background: 'var(--bg-app)', color: 'var(--text-sub)' }}>
                        {evt.event_date ? evt.event_date.split('T')[0] : ''}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: `${catColor}20`, color: catColor }}>
                        {evt.category || 'General'}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>{evt.subject}</h3>
                    <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                      {evt.image_url && (
                        <img src={evt.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {evt.details || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No additional details provided.</span>}
                        </p>
                        {evt.inventory_item_id && evt.quantity_used && (
                          <div style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: 6, width: 'fit-content' }}>
                            <Package size={14} /> Used: {evt.quantity_used} units
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button type="button" aria-label="Edit event" onClick={() => onEdit(evt)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 6 }}>
                      <Edit2 size={16} />
                    </button>
                    <button type="button" aria-label="Delete event" onClick={() => onDelete(evt.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 6 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {taggedIds.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>Tagged Goats:</span>
                    {taggedIds.map(gid => {
                      const g = goatById.get(gid);
                      return (
                        <span key={gid} onClick={() => { onGoatFilter(gid); setCurrentPage(1); }}
                          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                          🐐 {g ? g.name : `Goat ${gid}`}
                        </span>
                      );
                    })}
                  </div>
                )}

                {keywords.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {keywords.map(kw => (
                      <span key={kw} onClick={() => { onKeywordFilter(kw); setCurrentPage(1); }}
                        style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: activeKeywordFilter === kw ? '#6366f1' : 'rgba(99, 102, 241, 0.1)', color: activeKeywordFilter === kw ? 'white' : '#6366f1', fontWeight: 600, cursor: 'pointer' }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="glass-panel" style={{ padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="btn-filter" style={{ padding: '6px 12px', fontSize: 13, opacity: currentPage === 1 ? 0.5 : 1 }}>
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>
            Page {currentPage} of {totalPages} ({filteredEvents.length} events)
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="btn-filter" style={{ padding: '6px 12px', fontSize: 13, opacity: currentPage === totalPages ? 0.5 : 1 }}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}