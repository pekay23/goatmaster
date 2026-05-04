'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Activity, Calendar, Syringe, FileText, CheckCircle, ChevronRight } from 'lucide-react';

export default function HealthPanel({ goats, isLoading, showToast }) {
  const [view, setView]       = useState('add');     // 'add' | 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    goat_id: '',
    event_date: new Date().toISOString().split('T')[0],
    treatment: '',
    notes: '',
    next_due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resize notes textarea
  const textareaRef = useRef(null);
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  };
  useEffect(() => adjustHeight(), [formData.notes]);

  // Fetch history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/health', { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch { /* ignored */ }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { if (view === 'history') fetchHistory(); }, [view]);

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goat_id) {
      showToast?.('Please select a goat first', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast?.('Health record saved!');
        setFormData(p => ({ ...p, treatment: '', notes: '', next_due_date: '' }));
      } else {
        const d = await res.json().catch(() => ({}));
        showToast?.(d.error || 'Failed to save record', 'error');
      }
    } catch {
      showToast?.('Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goatNameById = id => goats.find(g => g.id === id)?.name || `Goat #${id}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* HEADER */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: '#fff3e0', padding: 10, borderRadius: 12 }}>
          <Activity size={24} color="#f57c00" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Medical Log</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            Treatments, vaccines, & follow-ups
          </p>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setView('add')} className={`btn-filter ${view === 'add' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
          New Record
        </button>
        <button onClick={() => setView('history')} className={`btn-filter ${view === 'history' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
          History
        </button>
      </div>

      {view === 'add' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Goat</label>
            <select name="goat_id" className="form-select" value={formData.goat_id} onChange={handleChange} required style={{ width: '100%', boxSizing: 'border-box' }}>
              <option value="">{isLoading ? '⏳…' : '— Select —'}</option>
              {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Date</label>
            <input type="date" name="event_date" className="form-input" value={formData.event_date} onChange={handleChange} required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Treatment / Procedure</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Syringe size={18} style={{ position: 'absolute', left: 14, top: 11, color: '#f57c00', opacity: 0.8 }} />
              <input type="text" name="treatment" className="form-input" placeholder="What was done?" value={formData.treatment} onChange={handleChange} required style={{ paddingLeft: 42, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Notes</label>
            <textarea ref={textareaRef} name="notes" className="form-input" placeholder="Optional details…" value={formData.notes} onChange={handleChange}
              style={{ minHeight: 80, maxHeight: 200, resize: 'none', overflowY: 'auto', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0, background: 'rgba(245, 124, 0, 0.05)', padding: '14px 16px', borderRadius: 14, border: '1px dashed rgba(245, 124, 0, 0.25)', width: '100%', boxSizing: 'border-box' }}>
            <label className="form-label" style={{ color: '#f57c00', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Calendar size={16} /> Remind me on (optional)
            </label>
            <input type="date" name="next_due_date" className="form-input" value={formData.next_due_date} onChange={handleChange}
              style={{ marginBottom: 0, width: '100%', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting || isLoading}
            style={{ width: '100%', justifyContent: 'center', background: '#f57c00', padding: 15, fontSize: 16, borderRadius: 16, marginTop: 4, boxShadow: '0 4px 12px rgba(245,124,0,0.2)' }}>
            <CheckCircle size={18} />
            {isSubmitting ? 'Saving…' : 'Save Health Record'}
          </button>
        </form>
      )}

      {view === 'history' && (
        <>
          {loadingHistory ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📋</div>
              <h3>No health records yet</h3>
              <p>Logged treatments and vaccines will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(h => {
                const eventDate = h.event_date?.split('T')[0];
                const dueDate = h.next_due_date?.split('T')[0];
                const overdue = dueDate && new Date(dueDate) < new Date();
                
                return (
                  <div key={h.id} className="glass-panel" style={{ padding: '16px 20px', borderLeft: dueDate ? (overdue ? '4px solid #ef4444' : '4px solid #f59e0b') : '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 800, background: 'var(--bg-app)', color: 'var(--text-sub)' }}>
                            {eventDate}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f57c00' }}>
                            🐐 {goatNameById(h.goat_id)}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
                          {h.treatment}
                        </div>
                        
                        {h.notes && (
                          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5, background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: 10, marginTop: 10 }}>
                            {h.notes}
                          </div>
                        )}
                        
                        {dueDate && (
                          <div style={{ fontSize: 12, color: overdue ? '#dc2626' : '#f57c00', fontWeight: 600, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} />
                            <span>Next Due: {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {overdue && <span style={{ fontSize: 9, background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>OVERDUE</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ background: 'var(--bg-app)', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="var(--text-sub)" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
