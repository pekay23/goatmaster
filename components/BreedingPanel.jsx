'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Calculator, Dna, CheckCircle } from 'lucide-react';

export default function BreedingPanel({ goats, isLoading, showToast }) {
  const [view, setView]   = useState('add');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({ dam_id: '', sire_id: '', date_bred: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSuccess, setLatestSuccess] = useState(null);

  const dams  = goats.filter(g => g.sex === 'F');
  const sires = goats.filter(g => g.sex === 'M');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/breeding', { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch { /* ignored */ }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { if (view === 'history') fetchHistory(); }, [view]);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dam_id || !formData.date_bred) {
      showToast?.('Doe and breeding date are required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/breeding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const result = await res.json();
        const damName = goats.find(g => g.id.toString() === formData.dam_id)?.name || 'Doe';
        setLatestSuccess({ damName, kiddingDate: result.estimated_kidding_date?.split('T')[0] });
        setFormData({ dam_id: '', sire_id: '', date_bred: '' });
        showToast?.(`Breeding logged for ${damName}`);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast?.(d.error || 'Failed to save', 'error');
      }
    } catch {
      showToast?.('Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: '#fce4ec', padding: 10, borderRadius: 12 }}>
          <Dna size={24} color="#e91e63" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Breeding & Lineage</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            Auto-estimates kidding date (150 days)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setView('add')} className={`btn-filter ${view === 'add' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
          Log Breeding
        </button>
        <button onClick={() => setView('history')} className={`btn-filter ${view === 'history' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
          Kidding Schedule
        </button>
      </div>

      {view === 'add' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dam (Doe)</label>
              <select name="dam_id" className="form-select" value={formData.dam_id} onChange={handleChange} required>
                <option value="">{isLoading ? '⏳…' : '— Select —'}</option>
                {dams.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {dams.length === 0 && !isLoading && (
                <p style={{ fontSize: 11, color: 'var(--text-sub)', margin: '4px 0 0' }}>No does in herd yet.</p>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sire (Buck)</label>
              <select name="sire_id" className="form-select" value={formData.sire_id} onChange={handleChange}>
                <option value="">— Optional —</option>
                {sires.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date Bred</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#e91e63', opacity: 0.7, pointerEvents: 'none' }} />
              <input type="date" name="date_bred" className="form-input" value={formData.date_bred} onChange={handleChange} required style={{ paddingLeft: 42 }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting || isLoading}
            style={{ width: '100%', justifyContent: 'center', background: '#e91e63', padding: 14, fontSize: 15 }}>
            <Calculator size={16} />
            {isSubmitting ? 'Calculating…' : 'Save & Estimate Kidding Date'}
          </button>

          {latestSuccess && (
            <div style={{ padding: 14, background: 'rgba(233, 30, 99, 0.07)', border: '1px solid rgba(233, 30, 99, 0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#e91e63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {latestSuccess.damName} — expected kidding
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                  {latestSuccess.kiddingDate}
                </div>
              </div>
              <Heart size={28} color="#e91e63" fill="#e91e63" style={{ opacity: 0.85 }} />
            </div>
          )}
        </form>
      )}

      {view === 'history' && (
        <>
          {loadingHistory ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>
              Loading kidding schedule…
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">🤰</div>
              <h3>No breeding records yet</h3>
              <p>Logged breedings and expected kidding dates will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(b => {
                const bredDate = b.date_bred?.split('T')[0];
                const kidDate  = b.estimated_kidding_date?.split('T')[0];
                const daysToGo = kidDate ? Math.ceil((new Date(kidDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const overdue  = daysToGo !== null && daysToGo < 0;
                const soon     = daysToGo !== null && daysToGo >= 0 && daysToGo <= 14;
                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: '#e91e63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bred {bredDate}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: '4px 0' }}>
                          {b.dam_name || `Goat #${b.dam_id}`}
                          {b.sire_name && <span style={{ color: 'var(--text-sub)', fontWeight: 400, fontSize: 13 }}> × {b.sire_name}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Expected: {kidDate}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: overdue ? '#dc2626' : soon ? '#f59e0b' : '#e91e63', fontWeight: 800, textTransform: 'uppercase' }}>
                          {overdue ? 'OVERDUE' : soon ? 'SOON' : 'PENDING'}
                        </div>
                        <div style={{ fontSize: 18, color: 'var(--text-main)', fontWeight: 700, marginTop: 2 }}>
                          {daysToGo === null ? '—' : daysToGo < 0 ? `${-daysToGo}d ago` : `${daysToGo}d`}
                        </div>
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
