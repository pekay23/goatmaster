'use client';
import { useState } from 'react';
import { Merge } from 'lucide-react';

export default function MergePanel({ goats, showToast, onMerged }) {
  const [merging, setMerging] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');

  const handleMerge = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setMerging(true);
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction_type: 'merge',
          source_goat_id: sourceId,
          target_goat_id: targetId,
          notes: 'Manual merge from settings',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Goats merged! Photos combined into one profile.', 'success');
        setSourceId(''); setTargetId('');
        if (onMerged) onMerged();
      } else {
        showToast(data.error || 'Merge failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setMerging(false); }
  };

  return (
    <div className="glass-panel" style={{ padding: 18, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Merge size={20} color="#f59e0b" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>Merge Duplicate Goats</div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Combine two profiles that are the same goat</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>
        Select the duplicate to remove and the correct profile to keep. All photos will be moved to the kept profile to improve future recognition.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4, display: 'block' }}>Duplicate to remove</label>
          <select className="form-select" value={sourceId} onChange={e => setSourceId(e.target.value)}>
            <option value="">-- select duplicate --</option>
            {goats.filter(g => String(g.id) !== targetId).map(g => (
              <option key={g.id} value={g.id}>{g.name} (ID: G{String(g.id).padStart(3,'0')})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4, display: 'block' }}>Correct profile to keep</label>
          <select className="form-select" value={targetId} onChange={e => setTargetId(e.target.value)}>
            <option value="">-- select correct goat --</option>
            {goats.filter(g => String(g.id) !== sourceId).map(g => (
              <option key={g.id} value={g.id}>{g.name} (ID: G{String(g.id).padStart(3,'0')})</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleMerge}
        disabled={merging || !sourceId || !targetId || sourceId === targetId}
        style={{
          width: '100%', padding: 13, borderRadius: 12, border: 'none',
          background: sourceId && targetId && sourceId !== targetId ? '#f59e0b' : 'var(--bg-app)',
          color: sourceId && targetId ? 'white' : 'var(--text-sub)',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {merging ? 'Merging...' : 'Merge & Remove Duplicate'}
      </button>
    </div>
  );
}