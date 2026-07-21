'use client';
import React, { useState, useMemo } from 'react';
import { Dna, Plus, History } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import BreedingForm from './breeding/BreedingForm';

export default function BreedingPanel({ goats = [], breedingRecords = [], isLoading = false, onUpdate, showToast }) {
  const [view, setView] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSuccess, setLatestSuccess] = useState(null);

  const goatById = useMemo(() => {
    const map = new Map(); goats.forEach(g => map.set(g.id, g)); return map;
  }, [goats]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const kiddingDate = new Date(data.mating_date);
      kiddingDate.setDate(kiddingDate.getDate() + 150);
      const payload = {
        id: generateUUID(),
        dam_id: data.dam_id,
        sire_id: data.sire_id,
        mating_date: data.mating_date,
        expected_kidding_date: kiddingDate.toISOString().split('T')[0],
        status: 'bred',
      };
      const db = await initDb();
      await db.put('breeding_records', payload);
      await queueSyncAction('breeding_records', 'CREATE', payload);
      const dam = goatById.get(data.dam_id);
      setLatestSuccess({ damName: dam?.name || 'Unknown', kiddingDate: kiddingDate.toISOString().split('T')[0] });
      showToast?.('Breeding record saved!');
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); showToast?.('Error saving record', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const sortedRecords = useMemo(() => {
    return [...breedingRecords].sort((a, b) => new Date(b.mating_date || 0) - new Date(a.mating_date || 0));
  }, [breedingRecords]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'rgba(236, 72, 153, 0.12)', padding: 10, borderRadius: 12 }}>
          <Dna size={24} color="#ec4899" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Breeding & Lineage</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Track matings, expected kidding dates, and pedigree</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'add', label: 'New Breeding', icon: Plus },
          { id: 'history', label: `History (${breedingRecords.length})`, icon: History },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setView(tab.id)}
            className={`btn-filter ${view === tab.id ? 'active' : ''}`}
            style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center' }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {latestSuccess && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', borderRadius: 12, border: '1px solid #86efac', color: '#166534', fontSize: 14 }}>
          ✅ {latestSuccess.damName} bred! Expected kidding: <strong>{latestSuccess.kiddingDate}</strong>
        </div>
      )}

      {view === 'add' && (
        <BreedingForm goats={goats} onSubmit={handleSubmit} onCancel={() => {}} isSubmitting={isSubmitting} />
      )}

      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedRecords.length === 0 ? (
            <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-sub)', fontSize: 13 }}>No breeding records yet.</div>
          ) : (
            sortedRecords.map(r => {
              const dam = goatById.get(r.dam_id);
              const sire = goatById.get(r.sire_id);
              const now = new Date();
              const kidding = r.expected_kidding_date ? new Date(r.expected_kidding_date) : null;
              const daysUntil = kidding ? Math.ceil((kidding - now) / (1000 * 60 * 60 * 24)) : null;
              return (
                <div key={r.id} className="glass-panel" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{dam?.name || 'Unknown'}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>×</span>
                    <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{sire?.name || 'Unknown'}</strong>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-app)', color: 'var(--text-sub)' }}>{r.mating_date?.split('T')[0]}</span>
                  </div>
                  {kidding && (
                    <div style={{ fontSize: 13, color: daysUntil !== null && daysUntil < 0 ? '#dc2626' : '#6366f1', fontWeight: 600 }}>
                      Kidding: {r.expected_kidding_date?.split('T')[0]} {daysUntil !== null ? (daysUntil < 0 ? `(${Math.abs(daysUntil)}d ago)` : `(in ${daysUntil}d)`) : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>Status: {r.status || 'bred'}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}