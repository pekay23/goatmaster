'use client';
import React, { useState, useEffect } from 'react';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alerts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setAlerts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || alerts.length === 0) return null;

  const isOverdue = (dateString) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(dateString) < today;
  };

  return (
    <div style={{ marginBottom: 20, border: '2px solid #d32f2f', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(211,47,47,0.15)' }}>
      <div style={{ backgroundColor: '#d32f2f', color: 'white', padding: '12px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>⚠️ Action Required</span>
        <span style={{ background: 'white', color: '#d32f2f', borderRadius: '50%', width: 22, height: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, fontWeight: 800 }}>
          {alerts.length}
        </span>
      </div>
      <div style={{ backgroundColor: '#fff5f5', padding: '10px 12px' }}>
        {alerts.map((alert) => {
          const overdue = isOverdue(alert.next_due_date);
          return (
            <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 8, backgroundColor: 'white', borderLeft: `5px solid ${overdue ? '#d32f2f' : '#ff9800'}`, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{alert.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{alert.treatment}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: overdue ? '#d32f2f' : '#ff9800', fontSize: 12 }}>
                  {overdue ? 'PAST DUE' : 'UPCOMING'}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {new Date(alert.next_due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
