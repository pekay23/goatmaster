'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, Layers, Edit3, X } from 'lucide-react';

export default function AdminTiers() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadTiers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/tiers');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load plans');
      if (!Array.isArray(data)) throw new Error('The plans response was not valid');
      setTiers(data);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Unable to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the server-owned plan catalog when this screen mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadTiers(); }, [loadTiers]);

  async function saveTier(tier) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unable to save this plan');
      setTiers(prev => prev.map(t => t.id === payload.id ? { ...t, ...payload } : t));
      setEditing(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this plan'); }
    setSaving(false);
  }

  return (
    <div className="gm-admin-workspace gm-admin-tiers">
      <header className="gm-admin-heading">
        <div>
          <p className="gm-admin-eyebrow">Plan configuration</p>
          <h1>Subscription tiers</h1>
          <p>Manage plan limits, features, and monthly checkout pricing.</p>
        </div>
      </header>

      {error && <p className="gm-admin-error" role="alert">{error}</p>}
      {loading ? (
        <section className="gm-admin-panel gm-admin-loading" role="status"><Loader2 size={22} className="animate-spin" /> Loading subscription tiers…</section>
      ) : loadError ? (
        <section className="gm-admin-panel"><p className="gm-admin-error" role="alert">{loadError}</p><button className="gm-admin-secondary" type="button" onClick={() => void loadTiers()}>Try again</button></section>
      ) : tiers.length === 0 ? (
        <section className="gm-admin-panel gm-admin-empty"><Layers size={25} aria-hidden="true"/><h2>No subscription tiers</h2><p>No plans were returned by the admin service.</p></section>
      ) : (
        <section className="gm-admin-tier-grid" aria-label="Subscription tiers">
          {tiers.map(tier => (
            <TierCard
              key={tier.id + '-' + JSON.stringify(tier)}
              tier={tier}
              isEditing={editing === tier.id}
              saving={saving}
              onEdit={() => setEditing(editing === tier.id ? null : tier.id)}
              onSave={saveTier}
            />
          ))}
        </section>
      )}

    </div>
  );
}

function TierCard({ tier, isEditing, saving, onEdit, onSave }) {
  const [form, setForm] = useState(() => ({ ...tier }));

  const price = tier.price_cents
    ? `${new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(tier.price_cents / 100)}/mo`
    : 'Free';

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <article className={`gm-admin-tier-card ${isEditing ? 'is-editing' : ''}`} data-tier={tier.id}>
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
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Monthly price (GHS)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(Number(form.price_cents || 0) / 100).toFixed(2)}
                onChange={e => handleChange('price_cents', Math.round((Number(e.target.value) || 0) * 100))}
                className="w-full px-2.5 py-2 rounded border border-border bg-bg-app text-text-main transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </div>

            <label className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app sm:col-span-2">
              <span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Monthly Paystack plan code</span>
              <input
                type="text"
                value={form.paystack_plan_code_monthly || ''}
                onChange={e => handleChange('paystack_plan_code_monthly', e.target.value)}
                maxLength={100}
                placeholder="Add the plan code from Paystack"
                className="w-full px-2.5 py-2 rounded border border-border bg-bg-app text-text-main transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
              <span className="text-xs text-text-sub">Required with a configured Paystack secret. Keep the Paystack plan amount in sync when changing this price here.</span>
            </label>

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
              className="gm-admin-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
              onClick={() => onSave(form)}
            >
              <Save size={14} className="shrink-0" /> Save
            </button>
            <button
              className="gm-admin-secondary flex-1"
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
            {tier.price_cents > 0 && <div className="tier-detail-row flex flex-col gap-0.5 p-2 rounded-lg bg-bg-app sm:col-span-2"><span className="tier-detail-label text-[11px] text-text-sub uppercase tracking-[0.3px] font-medium">Online checkout</span><span className="tier-detail-value font-semibold text-sm">{tier.paystack_plan_code_monthly ? 'Monthly Paystack plan configured' : 'Monthly Paystack plan code required'}</span></div>}

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
            className="gm-admin-secondary w-full mt-4"
            onClick={onEdit}
          >
            <Edit3 size={14} className="shrink-0" /> Edit
          </button>
        </>
      )}
    </article>
  );
}
