'use client';
import React, { useState } from 'react';
import { HeartPulse, Plus, Clock, History, Weight } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import HealthForm from './health/HealthForm';
import HealthHistory from './health/HealthHistory';
import WeightTracker from './health/WeightTracker';

export default function HealthPanel({ goats = [], healthRecords = [], weightRecords = [], isLoading = false, onUpdate, showToast, confirmAction }) {
  const [view, setView] = useState('add');
  const [editingRecord, setEditingRecord] = useState(null);

  const handleSubmitHealth = async (data) => {
    const isEdit = !!data.id;
    const payload = { ...data, id: data.id || generateUUID() };
    try {
      const db = await initDb();
      await db.put('health_records', payload);
      await queueSyncAction('health_records', isEdit ? 'UPDATE' : 'CREATE', payload);
      showToast?.(isEdit ? 'Health record updated!' : 'Health record saved!');
      setEditingRecord(null);
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Error saving record', 'error'); }
  };

  const handleDeleteHealth = async (id) => {
    try {
      const db = await initDb();
      await db.delete('health_records', id);
      await queueSyncAction('health_records', 'DELETE', { id });
      showToast?.('Health record deleted');
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Could not delete', 'error'); }
  };

  const handleSubmitWeight = async (data) => {
    const isEdit = !!data.id;
    const payload = { ...data, id: data.id || generateUUID() };
    try {
      const db = await initDb();
      await db.put('weight_records', payload);
      await queueSyncAction('weight_records', isEdit ? 'UPDATE' : 'CREATE', payload);
      showToast?.(isEdit ? 'Weight record updated!' : 'Weight recorded!');
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Error saving weight', 'error'); }
  };

  const handleDeleteWeight = async (id) => {
    try {
      const db = await initDb();
      await db.delete('weight_records', id);
      await queueSyncAction('weight_records', 'DELETE', { id });
      showToast?.('Weight record deleted');
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Could not delete', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: 10, borderRadius: 12 }}>
          <HeartPulse size={24} color="#ef4444" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Health & Weight</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Track treatments, vaccinations, checkups, and weight</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'add', label: 'Add Record', icon: Plus },
          { id: 'history', label: 'History', icon: History },
          { id: 'weights', label: 'Weights', icon: Weight },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setView(tab.id); setEditingRecord(null); }}
            className={`btn-filter ${view === tab.id ? 'active' : ''}`}
            style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center' }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {view === 'add' && (
        <HealthForm goats={goats} editingRecord={editingRecord}
          onSubmit={handleSubmitHealth}
          onCancel={() => setEditingRecord(null)} />
      )}

      {view === 'history' && (
        <HealthHistory records={healthRecords} goats={goats}
          onEdit={(r) => { setEditingRecord(r); setView('add'); }}
          onDelete={(id) => {
            if (confirmAction) {
              confirmAction('Delete Record?', 'Permanently delete this health record?', 'Delete', 'Cancel', () => handleDeleteHealth(id));
            } else { handleDeleteHealth(id); }
          }} />
      )}

      {view === 'weights' && (
        <WeightTracker goats={goats} weightRecords={weightRecords}
          onAdd={handleSubmitWeight}
          onEdit={(r) => {} /* inline editing handled inside WeightTracker */}
          onDelete={(id) => {
            if (confirmAction) {
              confirmAction('Delete Weight?', 'Permanently delete this weight record?', 'Delete', 'Cancel', () => handleDeleteWeight(id));
            } else { handleDeleteWeight(id); }
          }} />
      )}
    </div>
  );
}