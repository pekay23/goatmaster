'use client';
import React, { useState, useEffect } from 'react';
import { Users, Gift, ScanLine, Camera, Loader2, BarChart3, TrendingUp, CalendarDays } from 'lucide-react';

const TIER_COLORS = {
  free: '#888',
  basic: '#0066cc',
  pro: '#ffc107',
};

const STAT_ICONS = [
  { icon: Users, bg: 'bg-[var(--primary-bg)]', color: 'text-[var(--primary)]' },
  { icon: Gift, bg: 'bg-[var(--accent-bg)]', color: 'text-[var(--accent)]' },
  { icon: ScanLine, bg: 'bg-[var(--info-bg)]', color: 'text-[var(--info)]' },
  { icon: Camera, bg: 'bg-hsl([var(--pasture-300)])', color: 'text-hsl([var(--pasture-300)])' },
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
      <div className="admin-empty flex flex-col items-center justify-center p-3 text-text-sub text-sm">
        <div className="admin-empty-icon w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-1 text-text-muted">
          <BarChart3 size={20} />
        </div>
        <p>Failed to load dashboard stats.</p>
        <button className="admin-btn admin-btn-primary mt-2" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const totalByTier = stats.usersByTier.reduce((s, t) => s + t.count, 0) || 1;

  return (
    <>
      {/* Page Title */}
      <div className="admin-page-title flex items-center gap-2.5 mb-5">
        <div className="admin-page-title-icon w-9 h-9 rounded-lg flex items-center justify-center bg-primary-bg text-primary">
          <BarChart3 size={20} />
        </div>
        <h2 className="text-lg font-bold m-0">Dashboard</h2>
      </div>

      {/* Stat Cards — 1 col mobile, 2 col sm, 4 col lg */}
      <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, value: stats.totalUsers, label: 'Users' },
          { icon: Gift, value: stats.totalGoats, label: 'Goats' },
          { icon: ScanLine, value: stats.totalScans, label: 'Scans' },
          { icon: Camera, value: stats.totalEmbeddings, label: 'Embeddings' },
        ].map((item, i) => (
          <StatCard key={item.label} {...item} iconConfig={STAT_ICONS[i]} />
        ))}
      </div>

      {/* Users by Tier */}
      <div className="admin-section bg-bg-card border border-border rounded-xl p-5 mb-4 shadow-sm transition-shadow duration-150 hover:shadow">
        <h2 className="text-sm font-semibold m-0 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Users by Tier
        </h2>
        <div className="tier-bar flex h-[10px] rounded-lg overflow-hidden mb-0.5 bg-bg-app">
          {stats.usersByTier.map(t => (
            <div
              key={t.tier}
              className="tier-bar-segment transition-width duration-300 ease-in-out first:rounded-l-lg last:rounded-r-lg"
              style={{
                width: `${(t.count / totalByTier) * 100}%`,
                background: TIER_COLORS[t.tier] || '#888',
              }}
            />
          ))}
        </div>
        <div className="tier-legend flex gap-4 flex-wrap mt-0.625rem">
          {stats.usersByTier.map(t => (
            <div key={t.tier} className="tier-legend-item flex items-center gap-1.5 text-sm">
              <span
                className="tier-legend-dot w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: TIER_COLORS[t.tier] || '#888' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{t.tier || 'free'}</span>
              <span style={{ color: 'var(--text-sub)' }}>( {t.count} )</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signups Chart */}
      {stats.signupsLast30d && stats.signupsLast30d.length > 0 && (
        <div className="admin-section bg-bg-card border border-border rounded-xl p-5 shadow-sm transition-shadow duration-150 hover:shadow">
          <h2 className="text-sm font-semibold m-0 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" /> Signups (Last 30 Days)
          </h2>
          <div className="signup-chart flex items-end gap-0.5 h-[100px] p-1">
            {stats.signupsLast30d.map(d => {
              const max = Math.max(...stats.signupsLast30d.map(x => x.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="signup-bar flex-1 min-w-[4px] rounded-t-[3px] transition-all duration-150 cursor-pointer relative"
                  data-tooltip={`${d.date}: ${d.count}`}
                  style={{
                    height: `${Math.max(h, 4)}%`,
                    background: 'var(--primary)',
                  }}
                />
              );
            })}
          </div>
          <div className="signup-total flex items-center gap-1.5 mt-2 text-xs text-text-sub">
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
    <div className="statCard">
      <div className={`stat-card-icon ${iconConfig.bg} ${iconConfig.color}`}>
        <Icon size={18} className="shrink-0" />
      </div>
      <div className="stat-value text-[28px] font-bold text-text-main leading-1.2">
        {value?.toLocaleString() ?? '—'}
      </div>
      <div className="stat-label text-[12px] text-text-sub mt-1 uppercase tracking-[0.5px] font-medium">
        {label}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="admin-page-title flex items-center gap-2.5 mb-5">
        <div className="admin-page-title-icon w-9 h-9 rounded-lg flex items-center justify-center bg-primary-bg text-primary">
          <BarChart3 size={20} />
        </div>
        <h2 className="text-lg font-bold m-0">Dashboard</h2>
      </div>
      <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-stat h-24 rounded-xl animate-[shimmer_1.5s_infinite]" />
        ))}
      </div>
      <div className="admin-skeleton bg-bg-card border border-border rounded-lg p-5 mb-2">
        <div className="skeleton-line w-full h-[14px] mb-2 w-60 animate-[shimmer_1.5s_infinite]" />
        <div className="skeleton-line w-full h-[14px] mb-2 animate-[shimmer_1.5s_infinite]" />
        <div className="skeleton-line w-[30%] h-[10px] animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="admin-skeleton bg-bg-card border border-border rounded-lg p-5">
        <div className="skeleton-line w-full h-[14px] mb-2 w-40 animate-[shimmer_1.5s_infinite]" />
        <div className="skeleton-line w-full h-[14px] mb-2 animate-[shimmer_1.5s_infinite]" />
        <div className="skeleton-line w-[30%] h-[10px] animate-[shimmer_1.5s_infinite]" />
      </div>
    </>
  );
}
