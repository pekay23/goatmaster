'use client';
import React, { useState, useMemo } from 'react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { Plus, List, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DairyPanel({ goats, milkRecords = [], isLoading, showToast, confirmAction, onUpdate }) {
  const [view, setView] = useState('chart'); // 'list' | 'add' | 'chart'
  const [selectedGoat, setSelectedGoat] = useState('');
  
  const [formData, setFormData] = useState({
    goat_id: '',
    record_date: new Date().toISOString().split('T')[0],
    morning_yield: '',
    evening_yield: '',
    somatic_cell_count: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dairyGoats = goats.filter(g => g.sex === 'F'); // Only Does

  // Filter records by selected goat (if any)
  const filteredRecords = useMemo(() => {
    let recs = [...milkRecords];
    if (selectedGoat) {
      recs = recs.filter(r => r.goat_id === selectedGoat);
    }
    // Sort by date DESC for list
    return recs.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
  }, [milkRecords, selectedGoat]);

  // Chart data
  const chartData = useMemo(() => {
    if (!selectedGoat) return [];
    // Aggregate by date
    const recs = milkRecords.filter(r => r.goat_id === selectedGoat);
    const byDate = {};
    for (const r of recs) {
      const dateStr = r.record_date.split('T')[0];
      if (!byDate[dateStr]) byDate[dateStr] = { date: dateStr, morning: 0, evening: 0, total: 0 };
      const m = parseFloat(r.morning_yield) || 0;
      const e = parseFloat(r.evening_yield) || 0;
      byDate[dateStr].morning += m;
      byDate[dateStr].evening += e;
      byDate[dateStr].total += (m + e);
    }
    // Sort by date ASC for chart
    return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [milkRecords, selectedGoat]);

  const handleAddNew = () => {
    setFormData({
      goat_id: selectedGoat || '',
      record_date: new Date().toISOString().split('T')[0],
      morning_yield: '',
      evening_yield: '',
      somatic_cell_count: '',
      notes: ''
    });
    setEditingId(null);
    setView('add');
  };

  const handleEdit = (record) => {
    setFormData({
      goat_id: record.goat_id,
      record_date: record.record_date.split('T')[0],
      morning_yield: record.morning_yield || '',
      evening_yield: record.evening_yield || '',
      somatic_cell_count: record.somatic_cell_count || '',
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setView('add');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goat_id) {
      showToast('Please select a doe', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        id: editingId || generateUUID(),
        goat_id: formData.goat_id,
        record_date: formData.record_date,
        morning_yield: parseFloat(formData.morning_yield) || 0,
        evening_yield: parseFloat(formData.evening_yield) || 0,
        somatic_cell_count: formData.somatic_cell_count ? parseInt(formData.somatic_cell_count) : null,
        notes: formData.notes
      };
      
      const db = await initDb();
      await db.put('milk_records', payload);
      await queueSyncAction('milk_records', editingId ? 'UPDATE' : 'CREATE', payload);
      
      showToast(editingId ? 'Record updated' : 'Record added');
      onUpdate();
      setView('list');
    } catch {
      showToast('Error saving record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    confirmAction('Delete Record?', 'Are you sure you want to delete this milk record?', 'Delete', 'Cancel', async () => {
      try {
        const db = await initDb();
        await db.delete('milk_records', id);
        await queueSyncAction('milk_records', 'DELETE', { id });
        showToast('Record deleted');
        onUpdate();
      } catch {
        showToast('Error deleting record', 'error');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-app)', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <button onClick={() => setView('chart')} className={`tab-btn ${view === 'chart' ? 'active' : ''}`} style={{ padding: '8px 16px', border: 'none', background: view === 'chart' ? 'white' : 'transparent', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: view === 'chart' ? 600 : 400 }}>
            <TrendingUp size={16} /> Chart
          </button>
          <button onClick={() => setView('list')} className={`tab-btn ${view === 'list' ? 'active' : ''}`} style={{ padding: '8px 16px', border: 'none', background: view === 'list' ? 'white' : 'transparent', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: view === 'list' ? 600 : 400 }}>
            <List size={16} /> History
          </button>
        </div>

        <select className="form-input" value={selectedGoat} onChange={(e) => setSelectedGoat(e.target.value)} style={{ minWidth: 200, flex: 1, margin: 0 }}>
          <option value="">All Does</option>
          {dairyGoats.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.ear_tag || 'No Tag'})</option>
          ))}
        </select>

        <button className="btn-primary" onClick={handleAddNew} style={{ padding: '12px 16px' }}>
          <Plus size={18} /> Add Record
        </button>
      </div>

      {/* Main Content */}
      {view === 'add' ? (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Milk Record' : 'Log Milk Yield'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Doe</label>
                <select className="form-input" value={formData.goat_id} onChange={e => setFormData(p => ({ ...p, goat_id: e.target.value }))} required>
                  <option value="" disabled>Select Doe</option>
                  {dairyGoats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={formData.record_date} onChange={e => setFormData(p => ({ ...p, record_date: e.target.value }))} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Morning Yield (Liters/Kg)</label>
                <input type="number" step="0.01" className="form-input" value={formData.morning_yield} onChange={e => setFormData(p => ({ ...p, morning_yield: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Evening Yield (Liters/Kg)</label>
                <input type="number" step="0.01" className="form-input" value={formData.evening_yield} onChange={e => setFormData(p => ({ ...p, evening_yield: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Somatic Cell Count (Optional)</label>
              <input type="number" className="form-input" value={formData.somatic_cell_count} onChange={e => setFormData(p => ({ ...p, somatic_cell_count: e.target.value }))} placeholder="e.g., 200000" />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g., Colostrum, mastitis observed, etc." />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setView('list')} className="btn-filter" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      ) : view === 'chart' ? (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, height: 400 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, color: 'var(--text-main)' }}>Lactation Curve</h3>
          {!selectedGoat ? (
            <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
              <TrendingUp size={32} color="var(--text-sub)" />
              <p>Please select a specific doe to view her lactation curve.</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
              <p>No milk records found for this doe.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} L`, 'Total Yield']}
                />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="skeleton skeleton-card" style={{ padding: 16, borderRadius: 12 }}>
                <div className="skeleton skeleton-line medium" style={{ marginBottom: 8 }} />
                <div className="skeleton skeleton-line short" />
              </div>
            ))
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              <List size={32} color="var(--text-sub)" />
              <p>No milk records found.</p>
            </div>
          ) : (
            filteredRecords.map(rec => {
              const goat = goats.find(g => g.id === rec.goat_id);
              const m = parseFloat(rec.morning_yield) || 0;
              const e = parseFloat(rec.evening_yield) || 0;
              return (
                <div key={rec.id} className="glass-panel" style={{ padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>
                      {goat ? goat.name : 'Unknown Doe'} 
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-sub)', marginLeft: 8 }}>{new Date(rec.record_date).toLocaleDateString()}</span>
                    </h3>
                    <div style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4 }}>
                      Morning: <strong>{m}</strong> | Evening: <strong>{e}</strong> | Total: <strong style={{ color: 'var(--primary)' }}>{m+e}</strong>
                      {rec.somatic_cell_count && <span style={{ marginLeft: 12 }}>SCC: {rec.somatic_cell_count}</span>}
                    </div>
                    {rec.notes && <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4, fontStyle: 'italic' }}>"{rec.notes}"</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button aria-label="Edit milk record" onClick={() => handleEdit(rec)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button aria-label="Delete milk record" onClick={() => handleDelete(rec.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
