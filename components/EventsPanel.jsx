'use client';
import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Layers, BarChart2 } from 'lucide-react';
import { initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import EventForm from './events/EventForm';
import EventTimeline from './events/EventTimeline';
import KeywordInsights from './events/KeywordInsights';

export default function EventsPanel({ goats = [], farmEvents = [], inventory = [], initialEventGoatId = null, isLoading = false, showToast, onUpdate, confirmAction }) {
  const [view, setView] = useState('add');
  const [editingEventId, setEditingEventId] = useState(null);

  // Search/filter state — lifted here so it persists across tab switches
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoatFilter, setSelectedGoatFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeKeywordFilter, setActiveKeywordFilter] = useState('');

  const goatById = useMemo(() => {
    const map = new Map(); goats.forEach(g => map.set(g.id, g)); return map;
  }, [goats]);

  const deleteEventRecord = async (id) => {
    try {
      const db = await initDb();
      await db.delete('farm_events', id);
      await queueSyncAction('farm_events', 'DELETE', { id });
      showToast?.('Farm event deleted');
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Could not delete event', 'error'); }
  };

  const handleDeleteEvent = (id) => {
    if (confirmAction) {
      confirmAction('Delete Farm Event?', 'This permanently deletes the event and removes it from tagged goats.', 'Delete', 'Cancel', () => deleteEventRecord(id));
      return;
    }
    deleteEventRecord(id);
  };

  const handleEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setView('add');
  };

  const handleSaved = () => {
    setEditingEventId(null);
    if (onUpdate) onUpdate();
    setView('timeline');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: 10, borderRadius: 12, display: 'flex' }}>
          <CalendarDays size={24} color="#6366f1" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Farm Event & Activity Log</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Log events, tag goats, and analyze keyword occurrences</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'add', label: 'Log Event', icon: Plus },
          { id: 'timeline', label: `Timeline (${farmEvents.length})`, icon: Layers },
          { id: 'insights', label: 'Keyword Insights', icon: BarChart2 },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setView(tab.id); if (tab.id !== 'add') setEditingEventId(null); }}
            className={`btn-filter ${view === tab.id ? 'active' : ''}`}
            style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center', background: view === tab.id ? '#6366f1' : undefined, color: view === tab.id ? '#fff' : undefined }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* View 1: Event Form */}
      {view === 'add' && (
        <EventForm
          goats={goats} inventory={inventory}
          editingEventId={editingEventId}
          onSaved={handleSaved}
          showToast={showToast}
          onCancel={() => setEditingEventId(null)}
        />
      )}

      {/* View 2: Timeline */}
      {view === 'timeline' && (
        <EventTimeline
          farmEvents={farmEvents} goats={goats} isLoading={isLoading}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          activeKeywordFilter={activeKeywordFilter} onKeywordFilter={setActiveKeywordFilter}
          categoryFilter={categoryFilter} onCategoryFilter={setCategoryFilter}
          selectedGoatFilter={selectedGoatFilter} onGoatFilter={setSelectedGoatFilter}
          searchTerm={searchTerm} onSearch={setSearchTerm}
        />
      )}

      {/* View 3: Keyword Insights */}
      {view === 'insights' && (
        <KeywordInsights
          farmEvents={farmEvents}
          onKeywordClick={(kw) => { setActiveKeywordFilter(kw); setView('timeline'); }}
        />
      )}
    </div>
  );
}