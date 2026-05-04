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
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box' }}>
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
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Dam (Doe)</label>
            <select name="dam_id" className="form-select" value={formData.dam_id} onChange={handleChange} required style={{ width: '100%' }}>
              <option value="">{isLoading ? '⏳…' : '— Select —'}</option>
              {dams.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Sire (Buck)</label>
            <select name="sire_id" className="form-select" value={formData.sire_id} onChange={handleChange} style={{ width: '100%' }}>
              <option value="">— Optional —</option>
              {sires.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label">Date Bred</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Calendar size={18} style={{ position: 'absolute', left: 14, top: 11, color: '#e91e63', opacity: 0.8, pointerEvents: 'none' }} />
              <input type="date" name="date_bred" className="form-input" value={formData.date_bred} onChange={handleChange} required style={{ paddingLeft: 42, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting || isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: 15, fontSize: 16, borderRadius: 16, marginTop: 4, boxShadow: '0 4px 12px rgba(233,30,99,0.2)' }}>
            <Calendar size={18} />
            {isSubmitting ? 'Saving…' : 'Save & Estimate Kidding Date'}
          </button>

          {latestSuccess && (
            <div style={{ padding: 16, background: 'rgba(233, 30, 99, 0.05)', border: '1px solid rgba(233, 30, 99, 0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, animation: 'fadeInUp 0.4s ease-out' }}>
              <div>
                <div style={{ fontSize: 11, color: '#e91e63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {latestSuccess.damName} — Expected Kidding
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                  {new Date(latestSuccess.kiddingDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div style={{ background: 'white', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <Heart size={24} color="#e91e63" fill="#e91e63" style={{ opacity: 0.9 }} />
              </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(b => {
                const kidDate  = b.estimated_kidding_date?.split('T')[0];
                const daysToGo = kidDate ? Math.ceil((new Date(kidDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const overdue  = daysToGo !== null && daysToGo < 0;
                const soon     = daysToGo !== null && daysToGo >= 0 && daysToGo <= 14;
                
                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '16px 20px', borderLeft: overdue ? '4px solid #ef4444' : soon ? '4px solid #f59e0b' : '4px solid #e91e63' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                           <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 800, background: overdue ? '#fee2e2' : soon ? '#fff3cd' : '#fce4ec', color: overdue ? '#dc2626' : soon ? '#856404' : '#e91e63' }}>
                            {overdue ? 'OVERDUE' : soon ? 'DUE SOON' : 'EXPECTED'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>Bred: {b.date_bred?.split('T')[0]}</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.dam_name || `Goat #${b.dam_id}`}
                        </div>
                        {b.sire_name && (
                          <div style={{ fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Dna size={12} /> <span>Sire: {b.sire_name}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color="#e91e63" />
                          <span>{new Date(kidDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: 16, minWidth: 80 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Countdown</div>
                        <div style={{ fontSize: 20, color: overdue ? '#dc2626' : 'var(--text-main)', fontWeight: 800 }}>
                          {daysToGo === null ? '—' : daysToGo < 0 ? `${Math.abs(daysToGo)}d late` : `${daysToGo}d`}
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
