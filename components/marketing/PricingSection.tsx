'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import PaymentInformation from '@/components/shared/PaymentInformation';

type PlanTier = { id: string; name: string; price_cents: number; max_goats: number; max_scans_per_day: number; smart_scan_enabled: boolean; checkout_available: boolean };
type PlanState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; tiers: PlanTier[] };
function isPlanTier(value: unknown): value is PlanTier {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string' && value.id.length > 0
    && 'name' in value && typeof value.name === 'string' && value.name.length > 0
    && 'price_cents' in value && typeof value.price_cents === 'number' && Number.isSafeInteger(value.price_cents) && value.price_cents >= 0
    && 'max_goats' in value && typeof value.max_goats === 'number' && Number.isSafeInteger(value.max_goats) && value.max_goats >= -1
    && 'max_scans_per_day' in value && typeof value.max_scans_per_day === 'number' && Number.isSafeInteger(value.max_scans_per_day) && value.max_scans_per_day >= -1
    && 'smart_scan_enabled' in value && typeof value.smart_scan_enabled === 'boolean'
    && 'checkout_available' in value && typeof value.checkout_available === 'boolean';
}
function formatLimit(value: number, unit: string) { return value === -1 ? 'Unlimited' : value.toLocaleString() + ' ' + unit; }
function formatPrice(cents: number) { return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 }).format(cents / 100); }

export default function PricingSection() {
  const router = useRouter();
  const [state, setState] = useState<PlanState>({ status: 'loading' });
  const [selection, setSelection] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' }).then(response => {
      if (active) setSignedIn(response.ok);
    }).catch(() => { if (active) setSignedIn(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    async function load() {
      try {
        const response = await fetch('/api/public/tiers', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Pricing request failed');
        const payload: unknown = await response.json();
        if (!Array.isArray(payload) || !payload.length || !payload.every(isPlanTier)) throw new Error('Plan configuration unavailable');
        if (!cancelled) setState({ status: 'ready', tiers: payload });
      } catch { if (!cancelled) setState({ status: 'error' }); }
      finally { window.clearTimeout(timeout); }
    }
    void load();
    return () => { cancelled = true; window.clearTimeout(timeout); controller.abort(); };
  }, [requestVersion]);
  const tiers = state.status === 'ready' ? state.tiers : [];
  const selected = tiers.find(tier => tier.id === selection) ?? tiers[0];
  return <section className="pricing-section" id="plans" aria-labelledby="pricing-title"><div className="pricing-heading" data-reveal><p className="section-kicker">Room for your herd</p><h2 id="pricing-title">Start small.<br/><em>Keep growing.</em></h2><p>Compare current prices and included limits. Your farm’s paid upgrades are managed from account settings.</p></div>
    {state.status === 'loading' && <p className="pricing-message" role="status">Loading current plans…</p>}
    {state.status === 'error' && <div className="pricing-message"><p role="alert">Current plan prices could not be loaded. Please try again.</p><button type="button" className="marketing-button" onClick={() => { setState({ status: 'loading' }); setRequestVersion(version => version + 1); }}>Retry pricing</button></div>}
    {state.status === 'ready' && <><div className="pricing-grid" role="group" aria-label="Choose a plan">{tiers.map(tier => { const active = tier.id === selected?.id; return <article className={cn('pricing-card', active ? 'is-selected' : undefined)} key={tier.id}><div className="pricing-card-topline"><h3>{tier.name}</h3><span className="pricing-selected-label" aria-hidden={!active}>{active ? 'Selected' : ' '}</span></div><p className="pricing-price"><span>{formatPrice(tier.price_cents)}</span><span className="pricing-period">/ month</span></p><ul className="pricing-features"><li><span>Animal profiles</span><strong>{formatLimit(tier.max_goats, 'goats')}</strong></li><li><span>Daily scan allowance</span><strong>{formatLimit(tier.max_scans_per_day, 'scans')}</strong></li><li><span>Smart scan</span><strong>{tier.smart_scan_enabled ? 'Included' : 'Not included'}</strong></li></ul>{tier.price_cents > 0 && !tier.checkout_available && <p className="my-3 text-xs text-amber-900" role="status">Online checkout is being configured for this plan.</p>}<button type="button" className="pricing-select" aria-pressed={active} onClick={() => signedIn ? router.push('/plans?select=' + encodeURIComponent(tier.id)) : setSelection(tier.id)}>{signedIn ? `View ${tier.name} in your account` : active ? tier.name + ' selected' : 'Select ' + tier.name}</button></article>; })}</div><div className="pricing-next"><p role="status">{selected?.name} selected. {signedIn ? 'Continue to your account to review plan options.' : 'Create an account to get started.'}</p>{selected && (signedIn === null ? <button className="marketing-button" type="button" disabled>Checking account…</button> : <Link className="marketing-button" href={signedIn ? '/plans?select=' + encodeURIComponent(selected.id) : '/signup?plan=' + encodeURIComponent(selected.id)}>Continue with {selected.name} <span aria-hidden="true">↗</span></Link>)}</div></>}
    <p className="pricing-footnote">Monthly prices in Ghana cedis. Selecting a plan does not start a payment or change an existing subscription.</p>
    <PaymentInformation variant="marketing" />
  </section>;
}
