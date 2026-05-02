'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Camera, AlertCircle, ChevronRight, X } from 'lucide-react';

/**
 * Surfaces goats that may have matured since last enrolled and prompts
 * the user to re-scan them. Re-enrollment adds new embeddings without
 * deleting the old ones, so the system can match the goat at any age.
 */
export default function MaturationHelper({ goats = [], onSelectGoat, onDismiss }) {
  // Find goats that have a DOB and were enrolled more than 90 days after birth
  // OR goats with very few photos (≤ 2)
  const needsUpdate = goats.filter(g => {
    if ((g.photo_count || 0) < 3) return true;
    if (g.dob && g.created_at) {
      const dobDate = new Date(g.dob);
      const ageMonths = (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const enrollAgeMonths = (new Date(g.created_at) - dobDate) / (1000 * 60 * 60 * 24 * 30);
      // Was enrolled before 6 months old AND is now over 6 months
      if (enrollAgeMonths < 6 && ageMonths >= 6) return true;
      // Was enrolled before 12 months AND is now over 18 months (full maturity)
      if (enrollAgeMonths < 12 && ageMonths >= 18) return true;
    }
    return false;
  }).slice(0, 5);

  if (needsUpdate.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideUpFade 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ background: '#fef3c7', padding: 8, borderRadius: 10, flexShrink: 0 }}>
          <Calendar size={18} color="#92400e" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Update photos for grown goats</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.4 }}>
            Goats change a lot as they grow. Re-scan these goats so the AI can recognise them at any age.
          </p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {needsUpdate.map(g => (
          <button key={g.id} onClick={() => onSelectGoat?.(g)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-app)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            {g.image_url
              ? <img src={g.image_url} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} alt="" />
              : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐐</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                {(g.photo_count || 0) === 0
                  ? 'No photos enrolled yet'
                  : (g.photo_count || 0) === 1
                  ? 'Only 1 photo — needs more for accuracy'
                  : `${g.photo_count} photos · re-scan to update`}
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-sub)" />
          </button>
        ))}
      </div>
    </div>
  );
}
