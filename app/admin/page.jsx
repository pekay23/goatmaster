'use client';
import React, { useState, useEffect } from 'react';
import { Users, Github, ScanLine, Camera, Loader2 } from 'lucide-react';

const TIER_COLORS = {
  free: '#888',
  basic: '#0066cc',
  pro: '#ffc107',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-empty">
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="admin-empty">Failed to load stats.</div>;
  }

  const totalByTier = stats.usersByTier.reduce((s, t) => s + t.count, 0) || 1;

  return (
    <>
      <div className="stat-grid">
        <StatCard icon={Users} value={stats.totalUsers} label="Users" />
        <StatCard icon={Github} value={stats.totalGoats} label="Goats" />
        <StatCard icon={ScanLine} value={stats.totalScans} label="Scans" />
        <StatCard icon={Camera} value={stats.totalEmbeddings} label="Embeddings" />
      </div>

      <div className="admin-section">
        <h2>Users by Tier</h2>
        <div className="tier-bar">
          {stats.usersByTier.map(t => (
            <div
              key={t.tier}
              className="tier-bar-segment"
              style={{
                width: `${(t.count / totalByTier) * 100}%`,
                background: TIER_COLORS[t.tier] || '#888',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          {stats.usersByTier.map(t => (
            <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLORS[t.tier] || '#888' }} />
              <span style={{ textTransform: 'capitalize' }}>{t.tier || 'free'}</span>
              <span style={{ color: 'var(--text-sub)' }}>({t.count})</span>
            </div>
          ))}
        </div>
      </div>

      {stats.signupsLast30d.length > 0 && (
        <div className="admin-section">
          <h2>Signups (Last 30 Days)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
            {stats.signupsLast30d.map(d => {
              const max = Math.max(...stats.signupsLast30d.map(x => x.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(h, 4)}%`,
                    background: 'var(--primary)',
                    borderRadius: '3px 3px 0 0',
                    minWidth: 4,
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 6 }}>
            Total: {stats.signupsLast30d.reduce((s, d) => s + d.count, 0)} signups
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={18} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
