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
        <div className="admin-page-title flex items-center gap-2.5 mb-5">
          <div className="admin-page-title-icon w-9 h-9 rounded-lg flex items-center justify-center bg-primary-bg text-primary">
            <Layers size={20} />
          </div>
          <h2 className="text-lg font-bold m-0">Tiers</h2>
        </div>
        <div className="admin-empty flex flex-col items-center justify-center p-3">
          <Loader2 size={24} className="animate-[spin_1s_linear_infinite]" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Page Title */}
      <div className="admin-page-title flex items-center gap-2.5 mb-5">
        <div className="admin-page-title-icon w-9 h-9 rounded-lg flex items-center justify-center bg-primary-bg text-primary">
          <Layers size={20} />
        </div>
        <h2 className="text-lg font-bold m-0">Tiers</h2>
      </div>

      {/* Tier Grid — 1 col mobile, 2 col sm, 3 col lg */}
      <div className="tierGrid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
  const [form, setForm] = useState(() => ({ ...tier }));

  const price = tier.price_cents
    ? `$${(tier.price_cents / 100).toFixed(2)}/mo`
    : 'Free';

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="tierCard" data-tier={tier.id}>
      <h3 className="text-lg font-bold m-0 mb-1 flex items-center justify-between gap-2">
        {tier.name}
        <span className={`badge px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-[0.3px] leading-[1.3] badge-${tier.id}`}>
          {tier.user_count} users
        </span>
      </h3>
      <div className="tier-price text-sm text-text-sub mb-4 font-medium">{price}</div>

      {isEditing ? (
        <>
          <div className="tier-details grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-1.5 text-sm">
            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Max Goats</span>
              <input
                type="number"
                value={form.max_goats}
                onChange={e => handleChange('max_goats', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-2 rounded border border-border bg-bg-app text-text-main transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Scans/Day</span>
              <input
                type="number"
                value={form.max_scans_per_day}
                onChange={e => handleChange('max_scans_per_day', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-2 rounded border border-border bg-bg-app text-text-main transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Price (cents)</span>
              <input
                type="number"
                value={form.price_cents}
                onChange={e => handleChange('price_cents', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-2 rounded border border-border bg-bg-app text-text-main transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">AI Training</span>
              <div className="toggle flex items-end justify-end mt-1">
                <input
                  type="checkbox"
                  checked={form.ai_training_enabled}
                  onChange={e => handleChange('ai_training_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <span className="toggle-slider relative w-11 h-6 rounded-full bg-border-strong cursor-pointer transition-colors duration-150 peer-checked:bg-primary after:absolute after:inset-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform after:translate-x-0 peer-checked:after:translate-x-[20px] after:bg-white after:shadow-sm" />
              </div>
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Smart Scan</span>
              <div className="toggle flex items-end justify-end mt-1">
                <input
                  type="checkbox"
                  checked={form.smart_scan_enabled}
                  onChange={e => handleChange('smart_scan_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <span className="toggle-slider relative w-11 h-6 rounded-full bg-border-strong cursor-pointer transition-colors duration-150 peer-checked:bg-primary after:absolute after:inset-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform after:translate-x-0 peer-checked:after:translate-x-[20px] after:bg-white after:shadow-sm" />
              </div>
            </div>
          </div>

          <div className="tier-edit-actions flex gap-2 mt-4">
            <button
              className="admin-btn admin-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.97] transition-colors duration-150"
              disabled={saving}
              onClick={() => onSave(form)}
            >
              <Save size={14} className="shrink-0" /> Save
            </button>
            <button
              className="admin-btn admin-btn-ghost flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150"
              style={{ flex: 1 }}
              onClick={onEdit}
            >
              <X size={14} className="shrink-0" /> Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="tier-details grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Max Goats</span>
              <span className="tier-detail-value font-semibold text-sm">{tier.max_goats === -1 ? 'Unlimited' : tier.max_goats}</span>
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Scans/Day</span>
              <span className="tier-detail-value font-semibold text-sm">{tier.max_scans_per_day === -1 ? 'Unlimited' : tier.max_scans_per_day}</span>
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">AI Training</span>
              <span className="tier-detail-value font-semibold text-sm">{tier.ai_training_enabled ? 'Yes' : 'No'}</span>
            </div>

            <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Smart Scan</span>
              <span className="tier-detail-value font-semibold text-sm">{tier.smart_scan_enabled ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <button
            className="admin-btn admin-btn-ghost w-full mt-4 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150"
            onClick={onEdit}
          >
            <Edit3 size={14} className="shrink-0" /> Edit
          </button>
        </>
      )}
    </div>
  );
}
