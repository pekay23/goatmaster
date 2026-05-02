'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-main)',
      paddingBottom: 60,
    }}>
      {/* Header bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <a href="/" style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          padding: 8,
          color: 'var(--text-sub)',
          textDecoration: 'none',
          display: 'flex',
        }} aria-label="Back">
          <ArrowLeft size={18} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Goat Master</div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{title}</h1>
        </div>
      </header>

      <main style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 20px',
      }}>
        {lastUpdated && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-sub)',
            margin: '0 0 24px',
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            fontWeight: 500,
          }}>
            <strong>Last updated:</strong> {lastUpdated}
          </p>
        )}
        <div className="legal-content">
          {children}
        </div>
      </main>

      <style>{`
        .legal-content { font-size: 15px; line-height: 1.7; color: var(--text-main); }
        .legal-content h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 36px 0 12px;
          color: var(--text-main);
          padding-bottom: 8px;
          border-bottom: 2px solid var(--border-color);
        }
        .legal-content h2:first-child { margin-top: 8px; }
        .legal-content h3 {
          font-size: 17px;
          font-weight: 700;
          margin: 24px 0 10px;
          color: var(--text-main);
        }
        .legal-content h4 {
          font-size: 15px;
          font-weight: 700;
          margin: 20px 0 8px;
          color: var(--text-main);
        }
        .legal-content p { margin: 12px 0; color: var(--text-main); }
        .legal-content ul, .legal-content ol { padding-left: 24px; margin: 12px 0; }
        .legal-content li { margin: 8px 0; }
        .legal-content strong { color: var(--text-main); font-weight: 700; }
        .legal-content a { color: var(--primary); text-decoration: underline; }
        .legal-content a:hover { color: var(--primary-hover); }
        .legal-content code {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'SF Mono', Menlo, Consolas, monospace;
        }
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 14px;
        }
        .legal-content th, .legal-content td {
          padding: 10px 12px;
          text-align: left;
          border: 1px solid var(--border-color);
        }
        .legal-content th {
          background: var(--bg-card);
          font-weight: 700;
        }
        .legal-content blockquote {
          border-left: 4px solid var(--primary);
          padding: 8px 16px;
          margin: 16px 0;
          background: var(--bg-card);
          border-radius: 0 12px 12px 0;
          color: var(--text-sub);
          font-style: italic;
        }
        .legal-toc {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 16px 20px;
          margin: 0 0 24px;
        }
        .legal-toc h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1; color: var(--text-sub); }
        .legal-toc ol { padding-left: 20px; margin: 0; font-size: 14px; }
        .legal-toc li { margin: 4px 0; }
        .legal-toc a { color: var(--primary); text-decoration: none; }
      `}</style>
    </div>
  );
}
