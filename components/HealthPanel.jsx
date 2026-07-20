'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Activity, Calendar, Syringe, FileText, CheckCircle, Scale, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';

export default function HealthPanel({ goats, healthRecords = [], weightRecords = [], isLoading, showToast, onUpdate, confirmAction }) {
  const [view, setView]       = useState('add');     // 'add' | 'history' | 'upcoming' | 'weights'
  const [selectedWeightGoat, setSelectedWeightGoat] = useState('');

  const [formData, setFormData] = useState({
    goat_id: '',
    event_date: new Date().toISOString().split('T')[0],
    treatment: '',
    notes: '',
    next_due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightFormData, setWeightFormData] = useState({
    goat_id: '',
    record_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    notes: '',
  });
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [isWeightSubmitting, setIsWeightSubmitting] = useState(false);

  // Auto-resize notes textarea
  const textareaRef = useRef(null);
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  };
  useEffect(() => adjustHeight(), [formData.notes]);

  // History comes from props, no need to fetch here

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleWeightChange = (e) => {
    setWeightFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goat_id) {
      showToast?.('Please select a goat first', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        id: generateUUID(),
        goat_id: formData.goat_id,
        record_date: formData.event_date,
        treatment: formData.treatment,
        notes: formData.notes,
        next_due_date: formData.next_due_date || null,
        type: 'Treatment'
      };
      
      const db = await initDb();
      await db.put('health_records', payload);
      await queueSyncAction('health_records', 'CREATE', payload);

      showToast?.('Health record saved!');
      setFormData(p => ({ ...p, treatment: '', notes: '', next_due_date: '' }));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      showToast?.('Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goatNameById = id => goats.find(g => g.id === id)?.name || `Goat #${id}`;
  const selectedWeightGoatName = selectedWeightGoat ? goatNameById(selectedWeightGoat) : 'Select goat';

  const upcomingTreatmentRecords = useMemo(() => {
    return healthRecords
      .filter(record => record.next_due_date)
      .map(record => {
        const dueDate = new Date(record.next_due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.round((dueDate - today) / 86400000);
        return { ...record, dueDate, daysUntilDue };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [healthRecords]);

  const sortedWeightRecords = useMemo(() => {
    return [...weightRecords].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
  }, [weightRecords]);

  const filteredWeightRecords = useMemo(() => {
    if (!selectedWeightGoat) return sortedWeightRecords;
    return sortedWeightRecords.filter(record => record.goat_id === selectedWeightGoat);
  }, [selectedWeightGoat, sortedWeightRecords]);

  const weightChartData = useMemo(() => {
    if (!selectedWeightGoat) return [];
    return weightRecords
      .filter(record => record.goat_id === selectedWeightGoat && record.record_date)
      .map(record => ({
        date: record.record_date.split('T')[0],
        weight: Number(record.weight_kg) || 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedWeightGoat, weightRecords]);

  const growthSummary = useMemo(() => {
    if (weightChartData.length < 2) return null;
    const first = weightChartData[0];
    const latest = weightChartData[weightChartData.length - 1];
    const elapsedDays = Math.max(1, Math.round((new Date(latest.date) - new Date(first.date)) / 86400000));
    const gain = latest.weight - first.weight;
    return {
      latest: latest.weight,
      gain,
      adg: gain / elapsedDays,
      elapsedDays,
    };
  }, [weightChartData]);

  const resetWeightForm = (goatId = selectedWeightGoat) => {
    setWeightFormData({
      goat_id: goatId || '',
      record_date: new Date().toISOString().split('T')[0],
      weight_kg: '',
      notes: '',
    });
    setEditingWeightId(null);
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    const weight = Number.parseFloat(weightFormData.weight_kg);
    if (!weightFormData.goat_id) {
      showToast?.('Please select a goat first', 'error');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      showToast?.('Enter a valid weight', 'error');
      return;
    }

    setIsWeightSubmitting(true);
    try {
      const payload = {
        id: editingWeightId || generateUUID(),
        goat_id: weightFormData.goat_id,
        record_date: weightFormData.record_date,
        weight_kg: weight,
        notes: weightFormData.notes,
      };

      const db = await initDb();
      await db.put('weight_records', payload);
      await queueSyncAction('weight_records', editingWeightId ? 'UPDATE' : 'CREATE', payload);

      setSelectedWeightGoat(payload.goat_id);
      showToast?.(editingWeightId ? 'Weight record updated' : 'Weight record saved');
      resetWeightForm(payload.goat_id);
      onUpdate?.();
    } catch (err) {
      console.error(err);
      showToast?.('Could not save weight record', 'error');
    } finally {
      setIsWeightSubmitting(false);
    }
  };

  const handleEditWeight = (record) => {
    setWeightFormData({
      goat_id: record.goat_id,
      record_date: record.record_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      weight_kg: record.weight_kg ?? '',
      notes: record.notes || '',
    });
    setSelectedWeightGoat(record.goat_id);
    setEditingWeightId(record.id);
  };

  const deleteWeightRecord = async (id) => {
    try {
      const db = await initDb();
      await db.delete('weight_records', id);
      await queueSyncAction('weight_records', 'DELETE', { id });
      showToast?.('Weight record deleted');
      onUpdate?.();
    } catch (err) {
      console.error(err);
      showToast?.('Could not delete weight record', 'error');
    }
  };

  const handleDeleteWeight = (id) => {
    if (confirmAction) {
      confirmAction('Delete Weight Record?', 'This removes the local record and queues the delete for sync.', 'Delete', 'Cancel', () => deleteWeightRecord(id));
      return;
    }
    deleteWeightRecord(id);
  };

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
        <button onClick={() => setView('add')} className={`btn-filter ${view === 'add' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 8px', fontSize: 14 }}>
          New Record
        </button>
        <button onClick={() => setView('history')} className={`btn-filter ${view === 'history' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 8px', fontSize: 14 }}>
          History
        </button>
        <button onClick={() => setView('upcoming')} className={`btn-filter ${view === 'upcoming' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 8px', fontSize: 14 }}>
          Upcoming
        </button>
        <button onClick={() => setView('weights')} className={`btn-filter ${view === 'weights' ? 'active' : ''}`} style={{ flex: 1, padding: '11px 8px', fontSize: 14 }}>
          Weights
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

          <div className="form-group" style={{ marginBottom: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label className="form-label" style={{ alignSelf: 'flex-start' }}>Date</label>
            <input type="date" name="event_date" className="form-input" value={formData.event_date} onChange={handleChange} required style={{ width: '92%', boxSizing: 'border-box' }} />
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

          <div className="form-group" style={{ marginBottom: 0, background: 'rgba(245, 124, 0, 0.05)', padding: '14px 16px', borderRadius: 14, border: '1px dashed rgba(245, 124, 0, 0.25)', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label className="form-label" style={{ color: '#f57c00', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, alignSelf: 'flex-start' }}>
              <Calendar size={16} /> Remind me on (optional)
            </label>
            <input type="date" name="next_due_date" className="form-input" value={formData.next_due_date} onChange={handleChange}
              style={{ marginBottom: 0, width: '92%', boxSizing: 'border-box' }} />
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
          {isLoading ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>
              Loading history…
            </div>
          ) : healthRecords.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📋</div>
              <h3>No health records yet</h3>
              <p>Logged treatments and vaccines will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {healthRecords.map(h => {
                const eventDate = h.record_date?.split('T')[0] || h.event_date?.split('T')[0];
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

      {view === 'upcoming' && (
        <>
          {isLoading ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-sub)' }}>
              Loading schedule...
            </div>
          ) : upcomingTreatmentRecords.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <Calendar size={34} color="var(--text-sub)" />
              <h3>No upcoming treatments</h3>
              <p>Add a reminder date to a health record to build the schedule.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingTreatmentRecords.map(record => {
                const overdue = record.daysUntilDue < 0;
                const dueSoon = record.daysUntilDue <= 7;
                const statusLabel = overdue
                  ? `${Math.abs(record.daysUntilDue)} day${Math.abs(record.daysUntilDue) === 1 ? '' : 's'} overdue`
                  : record.daysUntilDue === 0
                    ? 'Due today'
                    : `Due in ${record.daysUntilDue} day${record.daysUntilDue === 1 ? '' : 's'}`;
                const statusColor = overdue ? '#dc2626' : dueSoon ? '#f57c00' : 'var(--primary)';

                return (
                  <div key={record.id} className="glass-panel" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', borderLeft: `4px solid ${statusColor}` }}>
                    <div style={{ background: overdue ? '#fee2e2' : dueSoon ? '#fff3e0' : 'var(--primary-bg)', color: statusColor, width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: statusColor }}>{statusLabel}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                          {record.dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-main)' }}>{record.treatment || 'Scheduled treatment'}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                        {goatNameById(record.goat_id)}
                      </div>
                      {record.notes && (
                        <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.45, marginTop: 8 }}>
                          {record.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === 'weights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'var(--primary-bg)', padding: 10, borderRadius: 12 }}>
                <Scale size={22} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-main)' }}>Weight Tracking</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Growth records and average daily gain</p>
              </div>
            </div>

            <select className="form-select" value={selectedWeightGoat} onChange={e => setSelectedWeightGoat(e.target.value)}>
              <option value="">All goats</option>
              {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <form onSubmit={handleWeightSubmit} className="glass-panel" style={{ padding: '18px', display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Goat</label>
                <select name="goat_id" className="form-select" value={weightFormData.goat_id} onChange={handleWeightChange} required>
                  <option value="">Select goat</option>
                  {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input type="date" name="record_date" className="form-input" value={weightFormData.record_date} onChange={handleWeightChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Weight (kg)</label>
                <input type="number" step="0.01" min="0" name="weight_kg" className="form-input" value={weightFormData.weight_kg} onChange={handleWeightChange} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes</label>
              <input type="text" name="notes" className="form-input" value={weightFormData.notes} onChange={handleWeightChange} placeholder="Scale used, body condition, feed change..." />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {editingWeightId && (
                <button type="button" className="btn-filter" onClick={resetWeightForm} style={{ flex: '1 1 140px', justifyContent: 'center' }}>Cancel Edit</button>
              )}
              <button type="submit" className="btn-primary" disabled={isWeightSubmitting || isLoading} style={{ flex: '1 1 180px', justifyContent: 'center', padding: 14 }}>
                <CheckCircle size={18} />
                {isWeightSubmitting ? 'Saving...' : editingWeightId ? 'Update Weight' : 'Save Weight'}
              </button>
            </div>
          </form>

          <div className="glass-panel" style={{ padding: 18, minHeight: 340 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>Growth Curve</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>{selectedWeightGoatName}</p>
              </div>
              {growthSummary && (
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-sub)', flexWrap: 'wrap' }}>
                  <span><strong style={{ color: 'var(--text-main)' }}>{growthSummary.latest.toFixed(1)} kg</strong> latest</span>
                  <span><strong style={{ color: growthSummary.gain >= 0 ? '#16a34a' : '#dc2626' }}>{growthSummary.adg.toFixed(2)} kg/day</strong> ADG</span>
                </div>
              )}
            </div>

            {!selectedWeightGoat ? (
              <div className="empty-state" style={{ padding: '48px 20px' }}>
                <TrendingUp size={32} color="var(--text-sub)" />
                <p>Select a goat to view its growth curve.</p>
              </div>
            ) : weightChartData.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 20px' }}>
                <p>No weight records for this goat yet.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={weightChartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} tickMargin={8} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} unit="kg" width={48} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value) => [`${Number(value).toFixed(2)} kg`, 'Weight']}
                    />
                    <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {isLoading ? (
              <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-sub)' }}>Loading weights...</div>
            ) : filteredWeightRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Scale size={36} color="var(--text-sub)" />
                <h3>No weights logged</h3>
                <p>Save the first weight record to start a growth curve.</p>
              </div>
            ) : (
              filteredWeightRecords.map(record => {
                const recordDate = record.record_date?.split('T')[0];
                return (
                  <div key={record.id} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                        {Number(record.weight_kg).toFixed(2)} kg
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginLeft: 8 }}>{goatNameById(record.goat_id)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 3 }}>{recordDate}</div>
                      {record.notes && <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.4 }}>{record.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button" aria-label="Edit weight record" onClick={() => handleEditWeight(record)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 8 }}>
                        <Edit2 size={18} />
                      </button>
                      <button type="button" aria-label="Delete weight record" onClick={() => handleDeleteWeight(record.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
