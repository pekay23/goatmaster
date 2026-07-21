'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarDays, Tag, Plus, Filter, Search, Trash2, Edit2, CheckCircle, BarChart2, Hash, Users, Sparkles, Layers, ChevronLeft, ChevronRight, X, AlertCircle, Camera, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';

// Common English stopwords for automatic keyword extraction from event subjects
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
  'set', 'took', 'done', 'made', 'get', 'gets', 'new', 'all'
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

const PRESET_CATEGORIES = [
  'General',
  'Health',
  'Breeding',
  'Feeding',
  'Sale',
  'Infrastructure',
  'Observation',
  'Emergency',
];

const CATEGORY_COLORS = {
  Health: '#ef4444',
  Breeding: '#ec4899',
  Feeding: '#10b981',
  Sale: '#f59e0b',
  Infrastructure: '#8b5cf6',
  Observation: '#3b82f6',
  Emergency: '#dc2626',
  General: '#6366f1',
};

export default function EventsPanel({
  goats = [],
  farmEvents = [],
  inventory = [],
  initialEventGoatId = null,
  isLoading = false,
  showToast,
  onUpdate,
  confirmAction,
}) {
  const [view, setView] = useState('add'); // 'add' | 'timeline' | 'insights'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [selectedGoatIds, setSelectedGoatIds] = useState(initialEventGoatId ? [initialEventGoatId] : []);
  const [goatSearchTerm, setGoatSearchTerm] = useState('');
  const [goatSexFilter, setGoatSexFilter] = useState('All');
  const [imageUrl, setImageUrl] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityUsed, setQuantityUsed] = useState('');

  // Timeline Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoatFilter, setSelectedGoatFilter] = useState('All'); // 'All' | 'F' | 'M' | 'W' | goat_id
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeKeywordFilter, setActiveKeywordFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Auto-resize notes textarea
  const textareaRef = useRef(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [details]);

  const resetForm = () => {
    setSubject('');
    setDetails('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCategory('General');
    setCustomCategory('');
    setIsCustomCategoryMode(false);
    setSelectedGoatIds([]);
    setImageUrl('');
    setInventoryItemId('');
    setQuantityUsed('');
    setEditingEventId(null);
    setGoatSearchTerm('');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) {
      showToast?.('Photo upload not configured. Contact support.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast?.('Image too large (max 5 MB).', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast?.('Please select an image file.', 'error');
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', preset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
      if (!res.ok) throw new Error('upload failed');
      const json = await res.json();
      if (json.secure_url) setImageUrl(json.secure_url);
    } catch {
      showToast?.('Image upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setSubject(evt.subject || '');
    setDetails(evt.details || '');
    setEventDate(evt.event_date ? evt.event_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setImageUrl(evt.image_url || '');
    setInventoryItemId(evt.inventory_item_id || '');
    setQuantityUsed(evt.quantity_used || '');
    
    if (PRESET_CATEGORIES.includes(evt.category)) {
      setCategory(evt.category);
      setIsCustomCategoryMode(false);
      setCustomCategory('');
    } else if (evt.category) {
      setCategory('Custom');
      setIsCustomCategoryMode(true);
      setCustomCategory(evt.category);
    } else {
      setCategory('General');
      setIsCustomCategoryMode(false);
    }

    setSelectedGoatIds(Array.isArray(evt.goat_ids) ? evt.goat_ids : []);
    setView('add');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      showToast?.('Subject/Title is required', 'error');
      return;
    }

    const finalCategory = isCustomCategoryMode && customCategory.trim() 
      ? customCategory.trim() 
      : (category === 'Custom' ? 'General' : category);

    const keywords = extractKeywords(subject);

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingEventId || generateUUID(),
        subject: subject.trim(),
        details: details.trim(),
        event_date: eventDate,
        category: finalCategory,
        keywords,
        goat_ids: selectedGoatIds,
        image_url: imageUrl || null,
        inventory_item_id: inventoryItemId || null,
        quantity_used: quantityUsed ? parseFloat(quantityUsed) : null,
      };

      const db = await initDb();
      await db.put('farm_events', payload);
      await queueSyncAction('farm_events', editingEventId ? 'UPDATE' : 'CREATE', payload);

      showToast?.(editingEventId ? 'Event updated successfully!' : 'Farm event recorded!');
      resetForm();
      if (onUpdate) onUpdate();
      setView('timeline');
    } catch (err) {
      console.error(err);
      showToast?.('Error saving event record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEventRecord = async (id) => {
    try {
      const db = await initDb();
      await db.delete('farm_events', id);
      await queueSyncAction('farm_events', 'DELETE', { id });
      showToast?.('Farm event deleted');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      showToast?.('Could not delete event', 'error');
    }
  };

  const handleDeleteEvent = (id) => {
    if (confirmAction) {
      confirmAction('Delete Farm Event?', 'This permanently deletes the event and removes it from tagged goats.', 'Delete', 'Cancel', () => deleteEventRecord(id));
      return;
    }
    deleteEventRecord(id);
  };

  // Helper map for goat lookup
  const goatById = useMemo(() => {
    const map = new Map();
    goats.forEach(g => map.set(g.id, g));
    return map;
  }, [goats]);

  // Filtered Goats for Multi-Select
  const availableGoats = useMemo(() => {
    return goats.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(goatSearchTerm.toLowerCase()) || 
                          (g.ear_tag && g.ear_tag.toLowerCase().includes(goatSearchTerm.toLowerCase()));
      const matchSex = goatSexFilter === 'All' || g.sex === goatSexFilter;
      return matchSearch && matchSex;
    });
  }, [goats, goatSearchTerm, goatSexFilter]);

  const toggleGoatSelection = (goatId) => {
    setSelectedGoatIds(prev =>
      prev.includes(goatId) ? prev.filter(id => id !== goatId) : [...prev, goatId]
    );
  };

  const selectGoatsByGroup = (sex) => {
    const targetGoats = goats.filter(g => sex === 'All' || g.sex === sex);
    const targetIds = targetGoats.map(g => g.id);
    const newSelection = new Set([...selectedGoatIds, ...targetIds]);
    setSelectedGoatIds(Array.from(newSelection));
  };

  const clearGoatSelection = () => {
    setSelectedGoatIds([]);
  };

  // Sort & Filter Timeline Events
  const filteredEvents = useMemo(() => {
    let result = [...farmEvents];

    // Sort descending by event_date
    result.sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0));

    // Keyword Filter
    if (activeKeywordFilter) {
      const kw = activeKeywordFilter.toLowerCase();
      result = result.filter(e => 
        (e.keywords && e.keywords.some(k => k.toLowerCase() === kw)) ||
        (e.subject && e.subject.toLowerCase().includes(kw))
      );
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Goat Filter (Can be 'F', 'M', 'W', or a specific goat_id)
    if (selectedGoatFilter !== 'All') {
      if (['F', 'M', 'W'].includes(selectedGoatFilter)) {
        result = result.filter(e => {
          if (!Array.isArray(e.goat_ids) || e.goat_ids.length === 0) return false;
          return e.goat_ids.some(gid => {
            const g = goatById.get(gid);
            return g && g.sex === selectedGoatFilter;
          });
        });
      } else {
        // Specific Goat ID
        result = result.filter(e => Array.isArray(e.goat_ids) && e.goat_ids.includes(selectedGoatFilter));
      }
    }

    // Search Term Filter
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Frequency Analytics & Keyword Cloud
  const keywordAnalytics = useMemo(() => {
    const counts = {};
    const categoryCounts = {};
    let totalTaggedGoats = 0;

    farmEvents.forEach(e => {
      // Category count
      const cat = e.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Tagged goats count
      if (Array.isArray(e.goat_ids)) {
        totalTaggedGoats += e.goat_ids.length;
      }

      // Keywords count (either stored or re-extracted)
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
  }, [farmEvents]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── HEADER PANEL ── */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: 10, borderRadius: 12, display: 'flex' }}>
          <CalendarDays size={24} color="#6366f1" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Farm Event & Activity Log</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            Log events, tag goats, and analyze keyword occurrences
          </p>
        </div>
      </div>

      {/* ── TAB SWITCHER ── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { setView('add'); if (!editingEventId) resetForm(); }}
          className={`btn-filter ${view === 'add' ? 'active' : ''}`}
          style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center', background: view === 'add' ? '#6366f1' : undefined, color: view === 'add' ? '#fff' : undefined }}
        >
          <Plus size={16} /> {editingEventId ? 'Edit Event' : 'Log Event'}
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`btn-filter ${view === 'timeline' ? 'active' : ''}`}
          style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center', background: view === 'timeline' ? '#6366f1' : undefined, color: view === 'timeline' ? '#fff' : undefined }}
        >
          <Layers size={16} /> Timeline ({farmEvents.length})
        </button>
        <button
          onClick={() => setView('insights')}
          className={`btn-filter ${view === 'insights' ? 'active' : ''}`}
          style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center', background: view === 'insights' ? '#6366f1' : undefined, color: view === 'insights' ? '#fff' : undefined }}
        >
          <BarChart2 size={16} /> Keyword Insights
        </button>
      </div>

      {/* ── VIEW 1: LOG EVENT FORM ── */}
      {view === 'add' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              {editingEventId ? '✏️ Modify Event' : '📝 New Farm Event Record'}
            </h3>
            {editingEventId && (
              <button type="button" onClick={resetForm} style={{ fontSize: 12, color: 'var(--text-sub)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Cancel editing
              </button>
            )}
          </div>

          {/* Subject/Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Title / Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dewormed all does in pen 3, Broken fence fixed at North Paddock..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            {subject.trim() && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>Detected Keywords:</span>
                {extractKeywords(subject).map(kw => (
                  <span key={kw} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', fontWeight: 600 }}>
                    #{kw}
                  </span>
                ))}
                {extractKeywords(subject).length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-sub)', italic: true }}>No key terms extracted</span>
                )}
              </div>
            )}
          </div>

          {/* Date & Category */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label className="form-label">Event Date</label>
              <input
                type="date"
                className="form-input"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label className="form-label">Category</label>
              {!isCustomCategoryMode ? (
                <select
                  className="form-select"
                  value={category}
                  onChange={e => {
                    if (e.target.value === 'Custom') {
                      setIsCustomCategoryMode(true);
                      setCategory('Custom');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                >
                  {PRESET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">✨ + Custom Category...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomCategoryMode(false); setCategory('General'); }}
                    style={{ padding: '0 12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-sub)', cursor: 'pointer', fontSize: 12 }}
                  >
                    Select
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Details / Observations (Optional)</label>
            <textarea
              ref={textareaRef}
              className="form-input"
              placeholder="Add full notes, observations, dosages, cost, or specifics..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              style={{ minHeight: 80, maxHeight: 220, resize: 'none', overflowY: 'auto', lineHeight: 1.5 }}
            />
          </div>

          {/* Multi-Goat Tagging Section */}
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
                <button type="button" onClick={() => selectGoatsByGroup('F')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ All Does</button>
                <button type="button" onClick={() => selectGoatsByGroup('M')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ All Bucks</button>
                <button type="button" onClick={() => selectGoatsByGroup('All')} className="btn-filter" style={{ padding: '4px 8px', fontSize: 11 }}>+ Tag All ({goats.length})</button>
                {selectedGoatIds.length > 0 && (
                  <button type="button" onClick={clearGoatSelection} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                )}
              </div>
            </div>

            {/* Tagged Goat Chips */}
            {selectedGoatIds.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 110, overflowY: 'auto', padding: 4 }}>
                {selectedGoatIds.map(gid => {
                  const g = goatById.get(gid);
                  if (!g) return null;
                  return (
                    <span
                      key={gid}
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 16,
                        background: 'var(--bg-card)',
                        border: '1px solid #6366f1',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      🐐 {g.name} {g.ear_tag ? `(${g.ear_tag})` : ''}
                      <X
                        size={14}
                        color="#ef4444"
                        style={{ cursor: 'pointer', marginLeft: 2 }}
                        onClick={() => toggleGoatSelection(gid)}
                      />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search & Filter available goats */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-bar" style={{ flex: 1, marginBottom: 0, background: 'var(--bg-card)' }}>
                <Search size={14} color="var(--text-sub)" />
                <input
                  className="search-input"
                  placeholder="Search goats by name or ear tag..."
                  value={goatSearchTerm}
                  onChange={e => setGoatSearchTerm(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
              <select
                className="form-select"
                value={goatSexFilter}
                onChange={e => setGoatSexFilter(e.target.value)}
                style={{ width: 110, fontSize: 12, padding: '6px 8px' }}
              >
                <option value="All">All Sexes</option>
                <option value="F">Does (F)</option>
                <option value="M">Bucks (M)</option>
                <option value="W">Wethers (W)</option>
              </select>
            </div>

            {/* Goats Pick Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
              {availableGoats.map(g => {
                const isSelected = selectedGoatIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGoatSelection(g.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {g.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-sub)', marginLeft: 4 }}>
                      {g.sex}
                    </span>
                  </div>
                );
              })}
              {availableGoats.length === 0 && (
                <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--text-sub)', textAlign: 'center', padding: 10 }}>
                  No goats match search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Area */}
          <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: '0', fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={16} color="#6366f1" /> Photo Attachment (Optional)
            </h3>
            <div style={{ textAlign: 'center', padding: 16, border: '2px dashed var(--border-color)', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)' }}>
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                {imageUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imageUrl} style={{ height: 140, width: '100%', borderRadius: 8, objectFit: 'cover' }} alt="Event" />
                    <button 
                      type="button" 
                      aria-label="Remove image"
                      onClick={(e) => { e.preventDefault(); setImageUrl(''); }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Camera size={28} style={{ color: 'var(--text-sub)' }} />
                    <p style={{ color: 'var(--text-sub)', margin: '8px 0 0', fontSize: 13 }}>{isUploading ? 'Uploading...' : 'Tap to add a photo'}</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Inventory Consumption */}
          <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: '0', fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={16} color="#6366f1" /> Used Inventory (Optional)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select 
                className="form-select" 
                value={inventoryItemId} 
                onChange={e => setInventoryItemId(e.target.value)}
                style={{ fontSize: 14 }}
              >
                <option value="">-- No item used --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} left)</option>
                ))}
              </select>
              {inventoryItemId && (
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Quantity Used</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={quantityUsed} 
                      onChange={e => setQuantityUsed(e.target.value)} 
                      min="0" step="0.01" 
                      placeholder="0.00" 
                    />
                    <span style={{ color: 'var(--text-sub)', fontSize: 14 }}>
                      {inventory.find(i => i.id === inventoryItemId)?.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || isLoading || isUploading}
            style={{ width: '100%', justifyContent: 'center', background: '#6366f1', padding: 15, fontSize: 16, borderRadius: 16, marginTop: 4, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}
          >
            <CheckCircle size={18} />
            {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : editingEventId ? 'Update Farm Event' : 'Save Farm Event'}
          </button>
        </form>
      )}

      {/* ── VIEW 2: TIMELINE VIEW ── */}
      {view === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="search-bar" style={{ marginBottom: 0, background: 'var(--bg-app)' }}>
              <Search size={16} color="var(--text-sub)" />
              <input
                className="search-input"
                placeholder="Search event title, details, keywords..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ fontSize: 14 }}
              />
              {searchTerm && (
                <X size={14} color="var(--text-sub)" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Category Filter */}
              <select
                className="form-select"
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, minWidth: 120, fontSize: 12, padding: '7px 10px' }}
              >
                <option value="All">All Categories</option>
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Goat Filter */}
              <select
                className="form-select"
                value={selectedGoatFilter}
                onChange={e => { setSelectedGoatFilter(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, minWidth: 140, fontSize: 12, padding: '7px 10px' }}
              >
                <option value="All">All Goats (Herd & Farm)</option>
                <optgroup label="── Sex Category ──">
                  <option value="F">Does (Females)</option>
                  <option value="M">Bucks (Males)</option>
                  <option value="W">Wethers (Castrated)</option>
                </optgroup>
                <optgroup label="── Specific Goat ──">
                  {goats.map(g => (
                    <option key={g.id} value={g.id}>{g.name} {g.ear_tag ? `(${g.ear_tag})` : ''}</option>
                  ))}
                </optgroup>
              </select>

              {/* Active Keyword Tag Indicator */}
              {activeKeywordFilter && (
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 14,
                    background: '#6366f1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                  }}
                >
                  #{activeKeywordFilter}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => setActiveKeywordFilter('')} />
                </span>
              )}

              {(searchTerm || categoryFilter !== 'All' || selectedGoatFilter !== 'All' || activeKeywordFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('All');
                    setSelectedGoatFilter('All');
                    setActiveKeywordFilter('');
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: 12, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Timeline List */}
          {isLoading ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>
              Loading farm events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">🗓️</div>
              <h3>No farm events found</h3>
              <p>
                {searchTerm || categoryFilter !== 'All' || selectedGoatFilter !== 'All' || activeKeywordFilter
                  ? 'No events match your current filter selection.'
                  : 'Start logging events like treatments, feedings, repairs, or observations to build your farm record.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginatedEvents.map(evt => {
                const catColor = CATEGORY_COLORS[evt.category] || '#6366f1';
                const eventDateFormatted = evt.event_date ? evt.event_date.split('T')[0] : '';
                const taggedIds = Array.isArray(evt.goat_ids) ? evt.goat_ids : [];
                const keywords = (Array.isArray(evt.keywords) && evt.keywords.length > 0)
                  ? evt.keywords
                  : extractKeywords(evt.subject);

                return (
                  <div
                    key={evt.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 18px',
                      borderLeft: `4px solid ${catColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* Event Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 800, background: 'var(--bg-app)', color: 'var(--text-sub)' }}>
                            {eventDateFormatted}
                          </span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: `${catColor}20`, color: catColor }}>
                            {evt.category || 'General'}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                          {evt.subject}
                        </h3>
                        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                          {evt.image_url && (
                            <img src={evt.image_url} alt="Attachment" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {evt.details || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No additional details provided.</span>}
                            </p>
                            {evt.inventory_item_id && evt.quantity_used && (
                              <div style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: 6, display: 'inline-flex' }}>
                                <Package size={14} />
                                Used: {evt.quantity_used} units
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          aria-label="Edit event"
                          onClick={() => handleEditEvent(evt)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 6 }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete event"
                          onClick={() => handleDeleteEvent(evt.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 6 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Details if present */}
                    {evt.details && (
                      <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5, background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 10 }}>
                        {evt.details}
                      </div>
                    )}

                    {/* Tagged Goats Chips */}
                    {taggedIds.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>Tagged Goats:</span>
                        {taggedIds.map(gid => {
                          const g = goatById.get(gid);
                          return (
                            <span
                              key={gid}
                              onClick={() => { setSelectedGoatFilter(gid); setCurrentPage(1); }}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: 'var(--bg-app)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              🐐 {g ? g.name : `Goat ${gid}`}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Keywords Badges */}
                    {keywords.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {keywords.map(kw => (
                          <span
                            key={kw}
                            onClick={() => { setActiveKeywordFilter(kw); setCurrentPage(1); }}
                            style={{
                              fontSize: 11,
                              padding: '2px 7px',
                              borderRadius: 10,
                              background: activeKeywordFilter === kw ? '#6366f1' : 'rgba(99, 102, 241, 0.1)',
                              color: activeKeywordFilter === kw ? 'white' : '#6366f1',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="glass-panel" style={{ padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-filter"
                style={{ padding: '6px 12px', fontSize: 13, opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>
                Page {currentPage} of {totalPages} ({filteredEvents.length} events)
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-filter"
                style={{ padding: '6px 12px', fontSize: 13, opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 3: KEYWORD FREQUENCY INSIGHTS ── */}
      {view === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Metric Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Total Farm Events</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{keywordAnalytics.totalEvents}</span>
              <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Logged across farm</span>
            </div>

            <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Distinct Keywords</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{keywordAnalytics.allKeywordsCount}</span>
              <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Extracted from titles</span>
            </div>

            <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Top Keyword</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {keywordAnalytics.topKeyword ? `#${keywordAnalytics.topKeyword.word}` : 'N/A'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                {keywordAnalytics.topKeyword ? `Occurred ${keywordAnalytics.topKeyword.count} times` : 'No events yet'}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Tagged Goat Events</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#ec4899' }}>{keywordAnalytics.totalTaggedGoats}</span>
              <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Total goat tags</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="glass-panel" style={{ padding: 18, borderRadius: 16, minHeight: 320 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                Top Keyword Occurrence Frequency
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
                Shows how often specific event subjects / keywords occur across your farm logs
              </p>
            </div>

            {keywordAnalytics.topKeywords.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <p>No keyword data available yet. Log farm events to generate insights.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={keywordAnalytics.topKeywords}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis type="category" dataKey="word" tick={{ fill: '#6b7280', fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value) => [`${value} occurrences`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {keywordAnalytics.topKeywords.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index < 3 ? '#818cf8' : '#a5b4fc'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Interactive Keywords Grid */}
          <div className="glass-panel" style={{ padding: 18, borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
              Explore Keywords (Click to Filter Timeline)
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {keywordAnalytics.topKeywords.map(k => (
                <button
                  key={k.word}
                  onClick={() => {
                    setActiveKeywordFilter(k.word);
                    setView('timeline');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 20,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#6366f1' }}>#{k.word}</span>
                  <span style={{ fontSize: 11, background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 10, color: 'var(--text-sub)' }}>
                    {k.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
