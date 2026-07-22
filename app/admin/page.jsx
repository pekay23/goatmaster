'use client';
import React, { useState, useEffect } from 'react';
import { Users, Github, ScanLine, Camera, Loader2, BarChart3, TrendingUp, CalendarDays } from 'lucide-react';

const TIER_COLORS = {
  free: '#888',
  basic: '#0066cc',
  pro: '#ffc107',
};

const STAT_ICONS = [
  { icon: Users, bg: 'var(--primary-bg)', color: 'var(--primary)' },
  { icon: Github, bg: 'var(--accent-bg)', color: 'var(--accent)' },
  { icon: ScanLine, bg: 'var(--info-bg)', color: 'var(--info)' },
  { icon: Camera, bg: 'hsl(140, 50%, 96%)', color: 'hsl(var(--pasture-300))' },
];

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
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon"><BarChart3 size={24} /></div>
        <p>Failed to load dashboard stats.</p>
        <button className="admin-btn admin-btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const totalByTier = stats.usersByTier.reduce((s, t) => s + t.count, 0) || 1;

  return (
    <>
      {/* Page Title */}
      <div className="admin-page-title">
        <div className="admin-page-title-icon"><BarChart3 size={20} /></div>
        <h2>Dashboard</h2>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { icon: Users, value: stats.totalUsers, label: 'Users' },
          { icon: Github, value: stats.totalGoats, label: 'Goats' },
          { icon: ScanLine, value: stats.totalScans, label: 'Scans' },
          { icon: Camera, value: stats.totalEmbeddings, label: 'Embeddings' },
        ].map((item, i) => (
          <StatCard key={item.label} {...item} iconConfig={STAT_ICONS[i]} />
        ))}
      </div>

      {/* Users by Tier */}
      <div className="admin-section">
        <h2><TrendingUp size={16} className="section-icon" /> Users by Tier</h2>
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
        <div className="tier-legend">
          {stats.usersByTier.map(t => (
            <div key={t.tier} className="tier-legend-item">
              <span
                className="tier-legend-dot"
                style={{ background: TIER_COLORS[t.tier] || '#888' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{t.tier || 'free'}</span>
              <span style={{ color: 'var(--text-sub)' }}>({t.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signups Chart */}
      {stats.signupsLast30d && stats.signupsLast30d.length > 0 && (
        <div className="admin-section">
          <h2><CalendarDays size={16} className="section-icon" /> Signups (Last 30 Days)</h2>
          <div className="signup-chart">
            {stats.signupsLast30d.map(d => {
              const max = Math.max(...stats.signupsLast30d.map(x => x.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="signup-bar"
                  data-tooltip={`${d.date}: ${d.count}`}
                  style={{
                    height: `${Math.max(h, 4)}%`,
                    background: 'var(--primary)',
                  }}
                />
              );
            })}
          </div>
          <div className="signup-total">
            <TrendingUp size={14} />
            Total: {stats.signupsLast30d.reduce((s, d) => s + d.count, 0)} signups
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ icon: Icon, value, label, iconConfig }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: iconConfig.bg, color: iconConfig.color }}>
        <Icon size={18} />
      </div>
      <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="admin-page-title">
        <div className="admin-page-title-icon"><BarChart3 size={20} /></div>
        <h2>Dashboard</h2>
      </div>
      <div className="skeleton-stat-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-stat skeleton-pulse" />
        ))}
      </div>
      <div className="admin-skeleton">
        <div className="skeleton-line short skeleton-pulse" />
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line tiny skeleton-pulse" />
      </div>
      <div className="admin-skeleton">
        <div className="skeleton-line short skeleton-pulse" />
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line tiny skeleton-pulse" />
      </div>
    </>
  );
}