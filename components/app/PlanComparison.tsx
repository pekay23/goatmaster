'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTier } from '@/lib/context/TierContext';
import PaymentInformation from '@/components/shared/PaymentInformation';

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  max_goats: number;
  max_scans_per_day: number;
  smart_scan_enabled: boolean;
  checkout_available: boolean;
};

function isPlan(value: unknown): value is Plan {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string' && value.id.length > 0
    && 'name' in value && typeof value.name === 'string' && value.name.length > 0
    && 'price_cents' in value && typeof value.price_cents === 'number' && Number.isSafeInteger(value.price_cents) && value.price_cents >= 0
    && 'max_goats' in value && typeof value.max_goats === 'number' && Number.isSafeInteger(value.max_goats) && value.max_goats >= -1
    && 'max_scans_per_day' in value && typeof value.max_scans_per_day === 'number' && Number.isSafeInteger(value.max_scans_per_day) && value.max_scans_per_day >= -1
    && 'smart_scan_enabled' in value && typeof value.smart_scan_enabled === 'boolean'
    && 'checkout_available' in value && typeof value.checkout_available === 'boolean';
}

function formatLimit(value: number, unit: string) {
  return value === -1 ? 'Unlimited' : `${value.toLocaleString()} ${unit}`;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

async function loadPlans(): Promise<Plan[]> {
  const response = await fetch('/api/public/tiers', { cache: 'no-store' });
  if (!response.ok) throw new Error('Current plans could not be loaded. Please try again.');
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.length || !payload.every(isPlan)) {
    throw new Error('Plan information is temporarily unavailable.');
  }
  return payload;
}

export default function PlanComparison({ selectedPlan }: { selectedPlan: string | null }) {
  const { tier: currentTier } = useTier();
  const plans = useQuery({ queryKey: ['plans'], queryFn: loadPlans, staleTime: 5 * 60 * 1000 });
  const checkout = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planId, interval: 'monthly' }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || typeof payload !== 'object' || payload === null || !('authorization_url' in payload) || typeof payload.authorization_url !== 'string') {
        const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Unable to start checkout. Please try again.';
        throw new Error(message);
      }
      return payload.authorization_url;
    },
    onSuccess: (authorizationUrl) => {
      const checkoutUrl = new URL(authorizationUrl);
      if (checkoutUrl.protocol === 'https:' && (checkoutUrl.hostname === 'checkout.paystack.com' || checkoutUrl.hostname.endsWith('.paystack.com'))) {
        window.location.assign(checkoutUrl.href);
      }
    },
  });

  return <section aria-label="Available plans" className="mt-8">
    {plans.isLoading && <p className="rounded-xl border border-slate-200 bg-white p-5" role="status">Loading current plans…</p>}
    {plans.error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-950"><p role="alert">{plans.error.message}</p><button type="button" className="mt-3 min-h-11 rounded-lg border border-rose-300 px-4 font-semibold" onClick={() => void plans.refetch()}>Try again</button></div>}
    {checkout.error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950" role="alert">{checkout.error.message}</p>}
    {plans.data && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.data.map(plan => {
      const isCurrent = plan.id === currentTier;
      const isRequested = !isCurrent && plan.id === selectedPlan;
      return <article key={plan.id} className={'flex flex-col rounded-2xl border bg-white p-5 shadow-sm ' + (isCurrent ? 'border-green-800 ring-2 ring-green-800/10' : isRequested ? 'border-amber-600 ring-2 ring-amber-600/10' : 'border-slate-200')}>
        <div className="flex items-start justify-between gap-3"><h2 className="font-serif text-xl font-semibold text-slate-900">{plan.name}</h2>{isCurrent ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">Current plan</span> : isRequested && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950">Selected</span>}</div>
        <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-950">{formatPrice(plan.price_cents)}<span className="ml-1 text-sm font-normal text-slate-600">/ month</span></p>
        <dl className="my-6 space-y-3 border-y border-slate-100 py-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-600">Animal profiles</dt><dd className="text-right font-medium text-slate-900">{formatLimit(plan.max_goats, 'goats')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-600">Daily scan allowance</dt><dd className="text-right font-medium text-slate-900">{formatLimit(plan.max_scans_per_day, 'scans')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-600">Smart scan</dt><dd className="text-right font-medium text-slate-900">{plan.smart_scan_enabled ? 'Included' : 'Not included'}</dd></div>
        </dl>
        <div className="mt-auto">
          {isCurrent ? <p className="min-h-11 content-center text-sm font-medium text-green-900">This is your farm’s active plan.</p>
            : plan.price_cents > 0 && plan.checkout_available ? <button type="button" className="min-h-11 w-full rounded-lg bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-900 disabled:cursor-wait disabled:opacity-60" disabled={checkout.isPending} onClick={() => checkout.mutate(plan.id)}>{checkout.isPending ? 'Opening secure checkout…' : `Continue with ${plan.name}`}</button>
              : plan.price_cents > 0 ? <p className="min-h-11 content-center text-sm text-amber-900" role="status">Online checkout for this plan is not configured yet.</p>
              : <p className="min-h-11 content-center text-sm text-slate-600">No checkout is available for this plan.</p>}
        </div>
      </article>;
    })}</div>}
    <p className="mt-5 text-sm text-slate-600">Monthly prices in Ghana cedis. Choosing a paid plan opens secure checkout; it does not change your plan until payment is confirmed.</p>
    <PaymentInformation />
    <nav aria-label="Plan page links" className="mt-6 flex flex-wrap gap-4 text-sm font-medium"><Link className="min-h-11 content-center text-green-900 underline underline-offset-4" href="/settings#billing">Back to billing</Link><Link className="min-h-11 content-center text-green-900 underline underline-offset-4" href="/dashboard">Return to your farm</Link></nav>
  </section>;
}
