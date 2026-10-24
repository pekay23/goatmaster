'use client';

import React from 'react';

const TIERS = ['free', 'pro', 'enterprise'];
const FEATURES = [
  { key: 'max_goats', label: 'Max Goats' },
  { key: 'max_scans_per_day', label: 'Scans/Day' },
  { key: 'ai_training_enabled', label: 'AI Training' },
  { key: 'smart_scan_enabled', label: 'Smart Scan' },
  { key: 'custom_domain', label: 'Custom Domain' },
];

export default function TierConfigMatrix({ tiers = [] }: { tiers?: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b px-3 py-2 text-left">Feature</th>
            {TIERS.map((t) => (
              <th key={t} className="border-b px-3 py-2 text-left capitalize">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((f) => (
            <tr key={f.key}>
              <td className="border-b px-3 py-2 font-medium">{f.label}</td>
              {TIERS.map((t) => {
                const tier = tiers.find((x) => x.id === t) || {};
                const val = tier[f.key];
                const display = val === -1 ? 'Unlimited' : val === true ? 'Yes' : val === false ? 'No' : val ?? '—';
                return <td key={t} className="border-b px-3 py-2">{display}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
