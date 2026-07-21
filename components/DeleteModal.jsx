'use client';
import { AlertTriangle } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', padding: 30, borderRadius: 24, width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', animation: 'scaleIn 0.2s ease-out' }}>
        <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fee2e2', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={32} color="#dc2626" />
          </div>
        </div>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-main)', fontSize: 20, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--text-sub)', fontSize: 15, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: 'var(--bg-app)', color: 'var(--text-sub)', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }}>{cancelText || 'Cancel'}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>{confirmText || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}