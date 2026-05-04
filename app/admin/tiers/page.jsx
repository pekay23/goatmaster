'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

export default function AdminTiers() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tiers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTiers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveTier(tier) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier),
      });
      if (res.ok) {
        const updated = await res.json();
        setTiers(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        setEditing(null);
      }
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="admin-empty">
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="tier-grid">
      {tiers.map(tier => (
        <TierCard
          key={tier.id}
          tier={tier}
          isEditing={editing === tier.id}
          saving={saving}
          onEdit={() => setEditing(editing === tier.id ? null : tier.id)}
          onSave={saveTier}
        />
      ))}
    </div>
  );
}

function TierCard({ tier, isEditing, saving, onEdit, onSave }) {
  const [form, setForm] = useState({ ...tier });

  useEffect(() => { setForm({ ...tier }); }, [tier]);

  const price = tier.price_cents
    ? `$${(tier.price_cents / 100).toFixed(2)}/mo`
    : 'Free';

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="tier-card">
      <h3>
        {tier.name}
        <span className={`badge badge-${tier.id}`}>{tier.user_count} users</span>
      </h3>
      <div className="tier-price">{price}</div>

      {isEditing ? (
        <>
          <div className="tier-details" style={{ marginBottom: 12 }}>
            <span className="tier-detail-label">Max Goats</span>
            <input
              type="number"
              value={form.max_goats}
              onChange={e => handleChange('max_goats', parseInt(e.target.value) || 0)}
              style={{ textAlign: 'right' }}
            />

            <span className="tier-detail-label">Scans/Day</span>
            <input
              type="number"
              value={form.max_scans_per_day}
              onChange={e => handleChange('max_scans_per_day', parseInt(e.target.value) || 0)}
              style={{ textAlign: 'right' }}
            />

            <span className="tier-detail-label">Price (cents)</span>
            <input
              type="number"
              value={form.price_cents}
              onChange={e => handleChange('price_cents', parseInt(e.target.value) || 0)}
              style={{ textAlign: 'right' }}
            />

            <span className="tier-detail-label">AI Training</span>
            <div className="toggle" style={{ justifySelf: 'end' }}>
              <input
                type="checkbox"
                checked={form.ai_training_enabled}
                onChange={e => handleChange('ai_training_enabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </div>

            <span className="tier-detail-label">Smart Scan</span>
            <div className="toggle" style={{ justifySelf: 'end' }}>
              <input
                type="checkbox"
                checked={form.smart_scan_enabled}
                onChange={e => handleChange('smart_scan_enabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={() => onSave(form)}
              style={{ flex: 1 }}
            >
              <Save size={14} /> Save
            </button>
            <button
              className="admin-btn"
              style={{ flex: 1, background: 'var(--bg-app)', color: 'var(--text-main)' }}
              onClick={onEdit}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="tier-details">
            <span className="tier-detail-label">Max Goats</span>
            <span className="tier-detail-value">{tier.max_goats === -1 ? 'Unlimited' : tier.max_goats}</span>

            <span className="tier-detail-label">Scans/Day</span>
            <span className="tier-detail-value">{tier.max_scans_per_day === -1 ? 'Unlimited' : tier.max_scans_per_day}</span>

            <span className="tier-detail-label">AI Training</span>
            <span className="tier-detail-value">{tier.ai_training_enabled ? 'Yes' : 'No'}</span>

            <span className="tier-detail-label">Smart Scan</span>
            <span className="tier-detail-value">{tier.smart_scan_enabled ? 'Yes' : 'No'}</span>
          </div>

          <button
            className="admin-btn"
            style={{ marginTop: 12, width: '100%', background: 'var(--bg-app)', color: 'var(--text-main)' }}
            onClick={onEdit}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
