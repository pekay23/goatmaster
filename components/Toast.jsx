'use client';
import { X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <X size={14} style={{ cursor: 'pointer', marginLeft: 10, flexShrink: 0 }} onClick={onClose} />
    </div>
  );
}