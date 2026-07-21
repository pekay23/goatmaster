'use client';
import { useState, useMemo } from 'react';
import { Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeightTracker({ goats, weightRecords, onAdd, onEdit, onDelete }) {
  const [filterGoatId, setFilterGoatId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');

  const filteredRecords = useMemo(() => {
    let records = [...weightRecords].sort((a, b) => new Date(b.record_date || 0) - new Date(a.record_date || 0));
    if (filterGoatId) records = records.filter(r => r.goat_id === filterGoatId);
    return records;
  }, [weightRecords, filterGoatId]);

  const chartData = useMemo(() => {
    return [...filteredRecords].reverse().map(r => ({
      date: r.record_date ? r.record_date.split('T')[0] : '',
      weight: parseFloat(r.weight_kg) || 0,
    }));
  }, [filteredRecords]);

  const adg = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const days = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
    if (days < 1) return null;
    return ((last.weight - first.weight) / days).toFixed(2);
  }, [chartData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!filterGoatId || !weightKg) return;
    onAdd({
      ...(editingRecord?.id ? { id: editingRecord.id } : {}),
      goat_id: filterGoatId,
      record_date: recordDate,
      weight_kg: parseFloat(weightKg),
      notes: notes.trim(),
    });
    setShowForm(false); setEditingRecord(null); setWeightKg(''); setNotes('');
  };

  const startEdit = (r) => {
    setEditingRecord(r);
    setRecordDate(r.record_date?.split('T')[0] || '');
    setWeightKg(String(r.weight_kg || ''));
    setNotes(r.notes || '');
    setShowForm(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: 10, borderRadius: 12 }}>
          <Scale size={22} color="#10b981" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>Weight Tracking</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Track growth and average daily gain</p>
        </div>
        <select className="form-select" value={filterGoatId} onChange={e => { setFilterGoatId(e.target.value); setShowForm(false); }}
          style={{ width: 160, fontSize: 12 }}>
          <option value="">-- Select goat --</option>
          {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {filterGoatId && !showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          <Scale size={16} /> Record Weight
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-main)' }}>{editingRecord ? 'Edit Weight' : 'New Weight Record'}</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
              <label className="form-label">Weight (kg)</label>
              <input type="number" className="form-input" value={weightKg} onChange={e => setWeightKg(e.target.value)} min="0" step="0.1" required placeholder="0.0" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (Optional)</label>
            <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Morning weigh-in" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setShowForm(false); setEditingRecord(null); }} style={{ flex: 1, padding: 12, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{editingRecord ? 'Update' : 'Save'}</button>
          </div>
        </form>
      )}

      {filterGoatId && chartData.length > 1 && (
        <div className="glass-panel" style={{ padding: 16, borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-main)' }}>Growth Chart</h4>
            {adg && <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>ADG: {adg} kg/day</span>}
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {filterGoatId && filteredRecords.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredRecords.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>{r.weight_kg} kg</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{r.record_date?.split('T')[0]} {r.notes ? `· ${r.notes}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => startEdit(r)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 4 }}>✏️</button>
                <button onClick={() => onDelete(r.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filterGoatId && filteredRecords.length === 0 && (
        <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-sub)', fontSize: 13 }}>No weight records for this goat yet.</div>
      )}
    </div>
  );
}