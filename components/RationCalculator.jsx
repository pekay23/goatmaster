'use client';
import React, { useMemo, useState } from 'react';
import { Calculator, Gauge, Info, Wheat } from 'lucide-react';

const CLASS_PRESETS = {
  maintenance: { label: 'Maintenance', protein: 10, dryMatter: 1.8 },
  growing: { label: 'Growing kid', protein: 16, dryMatter: 1.4 },
  lactating: { label: 'Lactating doe', protein: 14, dryMatter: 2.6 },
  lateGestation: { label: 'Late gestation', protein: 12, dryMatter: 2.2 },
  buck: { label: 'Breeding buck', protein: 11, dryMatter: 2.0 },
};

const EMPTY_FEEDS = {
  roughageName: 'Grass hay',
  roughageProtein: '8',
  roughageEnergy: '2.0',
  concentrateName: 'Dairy concentrate',
  concentrateProtein: '18',
  concentrateEnergy: '2.8',
};

export default function RationCalculator() {
  const [goatClass, setGoatClass] = useState('lactating');
  const [targetProtein, setTargetProtein] = useState(String(CLASS_PRESETS.lactating.protein));
  const [dryMatter, setDryMatter] = useState(String(CLASS_PRESETS.lactating.dryMatter));
  const [feeds, setFeeds] = useState(EMPTY_FEEDS);

  const result = useMemo(() => {
    const target = Number.parseFloat(targetProtein);
    const dmi = Number.parseFloat(dryMatter);
    const lowProtein = Number.parseFloat(feeds.roughageProtein);
    const highProtein = Number.parseFloat(feeds.concentrateProtein);
    const lowEnergy = Number.parseFloat(feeds.roughageEnergy);
    const highEnergy = Number.parseFloat(feeds.concentrateEnergy);

    if (![target, dmi, lowProtein, highProtein, lowEnergy, highEnergy].every(Number.isFinite) || dmi <= 0) {
      return { ok: false, message: 'Enter valid feed values to calculate a ration.' };
    }
    if (lowProtein === highProtein) {
      return { ok: false, message: 'The two ingredients need different protein percentages.' };
    }

    const highShare = (target - lowProtein) / (highProtein - lowProtein);
    const lowShare = 1 - highShare;
    const feasible = highShare >= 0 && highShare <= 1 && lowShare >= 0 && lowShare <= 1;
    const roughageKg = lowShare * dmi;
    const concentrateKg = highShare * dmi;
    const proteinKg = dmi * (target / 100);
    const energy = (lowShare * lowEnergy) + (highShare * highEnergy);

    return {
      ok: feasible,
      message: feasible
        ? 'Balanced on crude protein using the selected ingredients.'
        : 'Target protein is outside the range of these ingredients.',
      roughageKg,
      concentrateKg,
      roughagePct: lowShare * 100,
      concentratePct: highShare * 100,
      proteinKg,
      energy,
    };
  }, [dryMatter, feeds, targetProtein]);

  const handleClassChange = (e) => {
    const value = e.target.value;
    const preset = CLASS_PRESETS[value];
    setGoatClass(value);
    setTargetProtein(String(preset.protein));
    setDryMatter(String(preset.dryMatter));
  };

  const updateFeed = (field, value) => {
    setFeeds(previous => ({ ...previous, [field]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'var(--primary-bg)', padding: 10, borderRadius: 12 }}>
          <Wheat size={24} color="var(--primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Ration Calculator</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            Balance daily dry matter by crude protein.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Goat class</label>
            <select className="form-select" value={goatClass} onChange={handleClassChange}>
              {Object.entries(CLASS_PRESETS).map(([value, preset]) => (
                <option key={value} value={value}>{preset.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Target crude protein (%)</label>
            <input className="form-input" type="number" min="1" max="35" step="0.1" value={targetProtein} onChange={e => setTargetProtein(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dry matter intake (kg/day)</label>
            <input className="form-input" type="number" min="0.1" step="0.1" value={dryMatter} onChange={e => setDryMatter(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>Roughage / lower protein feed</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ingredient</label>
            <input className="form-input" value={feeds.roughageName} onChange={e => updateFeed('roughageName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Protein (%)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={feeds.roughageProtein} onChange={e => updateFeed('roughageProtein', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Energy (Mcal/kg)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={feeds.roughageEnergy} onChange={e => updateFeed('roughageEnergy', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>Concentrate / higher protein feed</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ingredient</label>
            <input className="form-input" value={feeds.concentrateName} onChange={e => updateFeed('concentrateName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Protein (%)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={feeds.concentrateProtein} onChange={e => updateFeed('concentrateProtein', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Energy (Mcal/kg)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={feeds.concentrateEnergy} onChange={e => updateFeed('concentrateEnergy', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calculator size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>Daily mix</h3>
        </div>

        <div style={{ padding: 12, borderRadius: 12, background: result.ok ? 'var(--primary-bg)' : '#fee2e2', color: result.ok ? 'var(--primary)' : '#dc2626', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={18} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{result.message}</span>
        </div>

        {result.ok && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--bg-app)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>{feeds.roughageName || 'Roughage'}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{result.roughageKg.toFixed(2)} kg</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{result.roughagePct.toFixed(0)}% of dry matter</div>
              </div>
              <div style={{ background: 'var(--bg-app)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>{feeds.concentrateName || 'Concentrate'}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{result.concentrateKg.toFixed(2)} kg</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{result.concentratePct.toFixed(0)}% of dry matter</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-sub)', fontSize: 13 }}>
                <Gauge size={18} color="var(--primary)" />
                <span><strong style={{ color: 'var(--text-main)' }}>{result.proteinKg.toFixed(2)} kg</strong> crude protein/day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-sub)', fontSize: 13 }}>
                <Gauge size={18} color="var(--primary)" />
                <span><strong style={{ color: 'var(--text-main)' }}>{result.energy.toFixed(2)}</strong> Mcal/kg weighted energy</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
