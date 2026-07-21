'use client';
import { useState } from 'react';

export default function BreedingForm({ goats, initialData, onSubmit, onCancel, isSubmitting }) {
  const [damId, setDamId] = useState(initialData?.dam_id || '');
  const [sireId, setSireId] = useState(initialData?.sire_id || '');
  const [dateBred, setDateBred] = useState(initialData?.mating_date?.split('T')[0] || new Date().toISOString().split('T')[0]);

  const dams = goats.filter(g => g.sex === 'F');
  const sires = goats.filter(g => g.sex === 'M');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!damId || !sireId) return;
    onSubmit({ dam_id: damId, sire_id: sireId, mating_date: dateBred });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>🧬 New Breeding Record</h3>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-sub)' }}>Select the dam (doe) and sire (buck) to create a mating record.</p>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Dam (Mother)</label>
        <select className="form-select" value={damId} onChange={e => setDamId(e.target.value)} required>
          <option value="">-- Select dam --</option>
          {dams.map(g => <option key={g.id} value={g.id}>{g.name} ({g.breed || 'Unknown'})</option>)}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Sire (Father)</label>
        <select className="form-select" value={sireId} onChange={e => setSireId(e.target.value)} required>
          <option value="">-- Select sire --</option>
          {sires.map(g => <option key={g.id} value={g.id}>{g.name} ({g.breed || 'Unknown'})</option>)}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Mating Date</label>
        <input type="date" className="form-input" value={dateBred} onChange={e => setDateBred(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !damId || !sireId} style={{ flex: 1, justifyContent: 'center' }}>
          {isSubmitting ? 'Saving…' : 'Record Breeding'}
        </button>
      </div>
    </form>
  );
}