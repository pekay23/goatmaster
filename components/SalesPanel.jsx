'use client';
import React, { useState } from 'react';
import { TrendingUp, Plus, List } from 'lucide-react';
import { initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import SaleForm from './sales/SaleForm';
import SalesList from './sales/SalesList';

export default function SalesPanel({ sales = [], inventory = [], isLoading = false, onUpdate, showToast, confirmAction, currency = 'GH₵' }) {
  const [view, setView] = useState('list');

  const handleDelete = async (id) => {
    if (confirmAction) {
      confirmAction('Delete Sale?', 'Permanently delete this sale record?', 'Delete', 'Cancel', async () => {
        try {
          const db = await initDb();
          await db.delete('sales', id);
          await queueSyncAction('sales', 'DELETE', { id });
          showToast?.('Sale deleted');
          if (onUpdate) onUpdate();
        } catch (err) { showToast?.('Could not delete', 'error'); }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: 10, borderRadius: 12 }}>
          <TrendingUp size={24} color="#f59e0b" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Sales & POS</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Record sales, print receipts, track revenue</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'list', label: `Sales (${sales.length})`, icon: List },
          { id: 'add', label: 'New Sale', icon: Plus },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setView(tab.id)}
            className={`btn-filter ${view === tab.id ? 'active' : ''}`}
            style={{ flex: 1, padding: '11px 8px', fontSize: 14, justifyContent: 'center' }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {view === 'add' && (
        <SaleForm inventory={inventory} showToast={showToast}
          onSaved={() => { if (onUpdate) onUpdate(); setView('list'); }}
          onCancel={() => setView('list')} />
      )}

      {view === 'list' && (
        <SalesList sales={sales} onDeleteReceipt={handleDelete} />
      )}
    </div>
  );
}