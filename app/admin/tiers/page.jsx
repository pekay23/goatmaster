'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Save, Layers, Edit3, X } from 'lucide-react';

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
      <>
        <div className="admin-page-title">
          <div className="admin-page-title-icon"><Layers size={20} /></div>
          <h2>Tiers</h2>
        </div>
        <div className="admin-empty">
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Page Title */}
      <div className="admin-page-title">
        <div className="admin-page-title-icon"><Layers size={20} /></div>
        <h2>Tiers</h2>
      </div>

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
    </>
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
    <div className="tier-card" data-tier={tier.id}>
      <h3>
        {tier.name}
        <span className={`badge badge-${tier.id}`}>{tier.user_count} users</span>
      </h3>
      <div className="tier-price">{price}</div>

      {isEditing ? (
        <>
          <div className="tier-details" style={{ marginBottom: 4 }}>
            <div className="tier-detail-row">
              <span className="tier-detail-label">Max Goats</span>
              <input
                type="number"
                value={form.max_goats}
                onChange={e => handleChange('max_goats', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">Scans/Day</span>
              <input
                type="number"
                value={form.max_scans_per_day}
                onChange={e => handleChange('max_scans_per_day', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">Price (cents)</span>
              <input
                type="number"
                value={form.price_cents}
                onChange={e => handleChange('price_cents', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">AI Training</span>
              <div className="toggle" style={{ justifySelf: 'end', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.ai_training_enabled}
                  onChange={e => handleChange('ai_training_enabled', e.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">Smart Scan</span>
              <div className="toggle" style={{ justifySelf: 'end', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.smart_scan_enabled}
                  onChange={e => handleChange('smart_scan_enabled', e.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </div>
          </div>

          <div className="tier-edit-actions">
            <button
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={() => onSave(form)}
              style={{ flex: 1 }}
            >
              <Save size={14} /> Save
            </button>
            <button
              className="admin-btn admin-btn-ghost"
              style={{ flex: 1 }}
              onClick={onEdit}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="tier-details">
            <div className="tier-detail-row">
              <span className="tier-detail-label">Max Goats</span>
              <span className="tier-detail-value">{tier.max_goats === -1 ? 'Unlimited' : tier.max_goats}</span>
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">Scans/Day</span>
              <span className="tier-detail-value">{tier.max_scans_per_day === -1 ? 'Unlimited' : tier.max_scans_per_day}</span>
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">AI Training</span>
              <span className="tier-detail-value">{tier.ai_training_enabled ? 'Yes' : 'No'}</span>
            </div>

            <div className="tier-detail-row">
              <span className="tier-detail-label">Smart Scan</span>
              <span className="tier-detail-value">{tier.smart_scan_enabled ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <button
            className="admin-btn admin-btn-ghost"
            style={{ marginTop: 16, width: '100%' }}
            onClick={onEdit}
          >
            <Edit3 size={14} /> Edit
          </button>
        </>
      )}
    </div>
  );
}