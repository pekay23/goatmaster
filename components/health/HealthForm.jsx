'use client';
import { useState } from 'react';

export default function HealthForm({ goats, editingRecord, onSubmit, onCancel }) {
  const [goatId, setGoatId] = useState(editingRecord?.goat_id || '');
  const [recordDate, setRecordDate] = useState(editingRecord?.record_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(editingRecord?.type || 'treatment');
  const [treatment, setTreatment] = useState(editingRecord?.treatment || '');
  const [notes, setNotes] = useState(editingRecord?.notes || '');
  const [cost, setCost] = useState(editingRecord?.cost || '');
  const [nextDueDate, setNextDueDate] = useState(editingRecord?.next_due_date?.split('T')[0] || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goatId || !treatment.trim()) return;
    onSubmit({
      ...(editingRecord?.id ? { id: editingRecord.id } : {}),
      goat_id: goatId,
      record_date: recordDate,
      type,
      treatment: treatment.trim(),
      notes: notes.trim(),
      cost: cost ? parseFloat(cost) : 0,
      next_due_date: nextDueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
        {editingRecord ? '✏️ Edit Health Record' : '📋 New Health Record'}
      </h3>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Goat</label>
        <select className="form-select" value={goatId} onChange={e => setGoatId(e.target.value)} required>
          <option value="">-- Select goat --</option>
          {goats.filter(g => g.id).map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.breed || 'Unknown'})</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
          <label className="form-label">Type</label>
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="treatment">Treatment</option>
            <option value="vaccination">Vaccination</option>
            <option value="checkup">Check-up</option>
            <option value="injury">Injury</option>
            <option value="surgery">Surgery</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Treatment / Diagnosis</label>
        <input type="text" className="form-input" placeholder="e.g. Ivermectin injection, Hoof trimming..." value={treatment}
          onChange={e => setTreatment(e.target.value)} required />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Notes (Optional)</label>
        <textarea className="form-input" placeholder="Dosage, symptoms, observations..." value={notes}
          onChange={e => setNotes(e.target.value)} style={{ minHeight: 70, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
          <label className="form-label">Cost (Optional)</label>
          <input type="number" className="form-input" value={cost} onChange={e => setCost(e.target.value)} min="0" step="0.01" placeholder="0.00" />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
          <label className="form-label">Next Due Date (Optional)</label>
          <input type="date" className="form-input" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{editingRecord ? 'Update Record' : 'Save Record'}</button>
      </div>
    </form>
  );
}