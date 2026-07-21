'use client';
import { AlertCircle, Calendar } from 'lucide-react';

export default function HealthHistory({ records, goats, onEdit, onDelete }) {
  const goatById = new Map(goats.map(g => [g.id, g]));
  const now = new Date();

  const upcoming = records
    .filter(r => r.next_due_date && new Date(r.next_due_date) >= now)
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  const overdue = records
    .filter(r => r.next_due_date && new Date(r.next_due_date) < now)
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  const history = [...records].sort((a, b) => new Date(b.record_date || 0) - new Date(a.record_date || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Upcoming Schedule */}
      {(upcoming.length > 0 || overdue.length > 0) && (
        <div className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="#6366f1" /> Upcoming Schedule
          </h3>
          {overdue.map(r => {
            const g = goatById.get(r.goat_id);
            const days = Math.floor((now - new Date(r.next_due_date)) / (1000 * 60 * 60 * 24));
            return (
              <div key={r.id} style={{ padding: 10, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong style={{ color: '#dc2626' }}>{g?.name || 'Unknown'}</strong> — {r.treatment} <span style={{ color: '#dc2626', fontWeight: 600 }}>({days}d overdue)</span></div>
                <button onClick={() => onEdit(r)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontWeight: 600 }}>Edit</button>
              </div>
            );
          })}
          {upcoming.map(r => {
            const g = goatById.get(r.goat_id);
            const days = Math.ceil((new Date(r.next_due_date) - now) / (1000 * 60 * 60 * 24));
            return (
              <div key={r.id} style={{ padding: 10, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{g?.name || 'Unknown'}</strong> — {r.treatment} <span style={{ color: '#6366f1', fontWeight: 600 }}>(due in {days}d)</span></div>
                <button onClick={() => onEdit(r)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontWeight: 600 }}>Edit</button>
              </div>
            );
          })}
        </div>
      )}

      {/* History List */}
      {history.length > 0 ? (
        history.map(r => {
          const g = goatById.get(r.goat_id);
          const isOverdue = r.next_due_date && new Date(r.next_due_date) < now;
          return (
            <div key={r.id} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{g?.name || 'Unknown'}</strong>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-app)', color: 'var(--text-sub)' }}>{r.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{r.record_date?.split('T')[0]}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', marginBottom: 2 }}>{r.treatment}</div>
                {r.notes && <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{r.notes}</div>}
                {r.next_due_date && (
                  <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, color: isOverdue ? '#dc2626' : '#6366f1' }}>
                    <AlertCircle size={12} /> Next: {r.next_due_date?.split('T')[0]} {isOverdue ? '(Overdue)' : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
                <button onClick={() => onEdit(r)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 4 }}>✏️</button>
                <button onClick={() => onDelete(r.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>🗑️</button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-sub)', fontSize: 13 }}>No health records yet. Add your first treatment record above.</div>
      )}
    </div>
  );
}