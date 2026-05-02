import React from 'react';
import { Mail, FileText, Shield } from 'lucide-react';

export default function SettingsFooter() {
  return (
    <footer style={{
      marginTop: 32,
      padding: 20,
      borderTop: '1px solid var(--border-color)',
      textAlign: 'center',
      color: 'var(--text-sub)',
      fontSize: 13,
    }}>
      {/* App version */}
      <div style={{ marginBottom: 14 }}>
        <strong style={{ color: 'var(--text-main)' }}>Goat Master</strong>
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>v1.1.0</span>
      </div>

      {/* Support */}
      <a href="mailto:samuel.hughes.23@outlook.com"
        style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 14 }}>
        <Mail size={14} /> Contact Support
      </a>

      {/* Legal links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-sub)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <Shield size={12} /> Privacy Policy
        </a>
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-sub)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <FileText size={12} /> Terms of Service
        </a>
      </div>

      <div style={{ fontSize: 11, color: '#999' }}>
        © {new Date().getFullYear()} Goat Master · Made in Ghana 🇬🇭
      </div>
    </footer>
  );
}
