'use client';
import React, { useState, useEffect } from 'react';

import { initDb } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { X } from 'lucide-react';

const AlertsPanel = ({ alerts = [], onUpdate, showToast }) => {
  const activeAlerts = alerts.filter(a => !a.is_read);

  if (activeAlerts.length === 0) return null;

  const handleDismiss = async (alert) => {
    try {
      const updated = { ...alert, is_read: true };
      const db = await initDb();
      await db.put('alerts', updated);
      await queueSyncAction('alerts', 'UPDATE', updated);
      if (onUpdate) onUpdate();
    } catch {
      showToast?.('Error dismissing alert', 'error');
    }
  };

  const isOverdue = (dateString) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(dateString) < today;
  };

  return (
    <div style={{ marginBottom: 20, border: '2px solid #d32f2f', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(211,47,47,0.15)' }}>
      <div style={{ backgroundColor: '#d32f2f', color: 'white', padding: '12px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>⚠️ Action Required</span>
        <span style={{ background: 'white', color: '#d32f2f', borderRadius: '50%', width: 22, height: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, fontWeight: 800 }}>
          {activeAlerts.length}
        </span>
      </div>
      <div style={{ backgroundColor: '#fff5f5', padding: '10px 12px' }}>
        {activeAlerts.map((alert) => (
          <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 8, backgroundColor: 'white', borderLeft: `5px solid ${alert.type === 'error' || alert.type === 'urgent' ? '#d32f2f' : '#ff9800'}`, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ flex: 1, paddingRight: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{alert.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>{alert.message}</div>
            </div>
            <button onClick={() => handleDismiss(alert)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
