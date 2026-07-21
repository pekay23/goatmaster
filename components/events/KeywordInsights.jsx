'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { computeKeywordAnalytics } from './utils';

export default function KeywordInsights({ farmEvents, onKeywordClick }) {
  const analytics = React.useMemo(() => computeKeywordAnalytics(farmEvents), [farmEvents]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Total Farm Events</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{analytics.totalEvents}</span>
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Logged across farm</span>
        </div>
        <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Distinct Keywords</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{analytics.allKeywordsCount}</span>
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Extracted from titles</span>
        </div>
        <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Top Keyword</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {analytics.topKeyword ? `#${analytics.topKeyword.word}` : 'N/A'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{analytics.topKeyword ? `Occurred ${analytics.topKeyword.count} times` : 'No events yet'}</span>
        </div>
        <div className="glass-panel" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600 }}>Tagged Goat Events</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#ec4899' }}>{analytics.totalTaggedGoats}</span>
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Total goat tags</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 18, borderRadius: 16, minHeight: 320 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>Top Keyword Occurrence Frequency</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>Shows how often specific event subjects / keywords occur across your farm logs</p>
        </div>
        {analytics.topKeywords.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}><p>No keyword data available yet. Log farm events to generate insights.</p></div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topKeywords} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="word" tick={{ fill: '#6b7280', fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value) => [`${value} occurrences`, 'Count']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {analytics.topKeywords.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index < 3 ? '#818cf8' : '#a5b4fc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 18, borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>Explore Keywords (Click to Filter Timeline)</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {analytics.topKeywords.map(k => (
            <button key={k.word} onClick={() => onKeywordClick?.(k.word)}
              style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#6366f1' }}>#{k.word}</span>
              <span style={{ fontSize: 11, background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 10, color: 'var(--text-sub)' }}>{k.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}