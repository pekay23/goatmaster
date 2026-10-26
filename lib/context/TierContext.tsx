'use client';

import { createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

interface TierFeatures {
  maxGoats: number;
  maxScansPerDay: number;
  aiTrainingEnabled: boolean;
  smartScanEnabled: boolean;
  hasFeature: (feature: string) => boolean;
}

interface TierContextType {
  tier: string;
  features: TierFeatures | null;
  isLoading: boolean;
  canUseFeature: (feature: string) => boolean;
  getLimit: (limit: 'goats' | 'scans') => number;
}

const TierContext = createContext<TierContextType | null>(null);

const FEATURE_MAP: Record<string, { free: boolean; basic: boolean; pro: boolean; enterprise: boolean }> = {
  'smart-scan': { free: false, basic: false, pro: true, enterprise: true },
  'ai-training': { free: false, basic: true, pro: true, enterprise: true },
  'breeding-records': { free: false, basic: true, pro: true, enterprise: true },
  'health-records': { free: false, basic: true, pro: true, enterprise: true },
  'inventory-records': { free: false, basic: true, pro: true, enterprise: true },
  'lineage-tracking': { free: false, basic: true, pro: true, enterprise: true },
  'advanced-analytics': { free: false, basic: false, pro: true, enterprise: true },
  'feed-optimization': { free: false, basic: false, pro: true, enterprise: true },
  'api-access': { free: false, basic: false, pro: true, enterprise: true },
  'custom-reports': { free: false, basic: false, pro: true, enterprise: true },
  'priority-support': { free: false, basic: false, pro: true, enterprise: true },
  'white-label': { free: false, basic: false, pro: false, enterprise: true },
  'sso': { free: false, basic: false, pro: false, enterprise: true },
  'dedicated-support': { free: false, basic: false, pro: false, enterprise: true },
  'sla': { free: false, basic: false, pro: false, enterprise: true },
};

export function TierProvider({ children, orgId }: { children: ReactNode; orgId: string }) {
  const plan = useQuery({
    queryKey: ['organization-tier', orgId],
    queryFn: async () => {
      const response = await fetch('/api/app/org/' + orgId + '/tier');
      if (!response.ok) throw new Error('Unable to load plan settings');
      return response.json();
    },
  });
  const tier: string = plan.data?.tier ?? 'free';
  const features: TierFeatures = {
    maxGoats: plan.data?.max_goats ?? 0,
    maxScansPerDay: plan.data?.max_scans_per_day ?? 0,
    aiTrainingEnabled: plan.data?.ai_training_enabled === true,
    smartScanEnabled: plan.data?.smart_scan_enabled === true,
    hasFeature: (feature: string) => {
      if (feature === 'smart-scan') return plan.data?.smart_scan_enabled === true;
      if (feature === 'ai-training') return plan.data?.ai_training_enabled === true;
      const map = FEATURE_MAP[feature];
      return map ? Object.entries(map).some(([name, enabled]) => name === tier && enabled) : false;
    },
  };
  return <TierContext.Provider value={{ tier, features, isLoading: plan.isLoading, canUseFeature: features.hasFeature, getLimit: limit => limit === 'goats' ? features.maxGoats : features.maxScansPerDay }}>{children}</TierContext.Provider>;
}

export function useTier() {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}

// Feature gate component
export function FeatureGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { canUseFeature, tier, isLoading } = useTier();
  if (isLoading) return <p role="status">Loading plan…</p>;
  if (!canUseFeature(feature)) {
    const label = feature === 'breeding-records' ? 'Breeding records' : feature === 'health-records' ? 'Health records' : feature === 'inventory-records' ? 'Inventory tracking' : feature;
    return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8" aria-labelledby="feature-lock-title"><p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Included with Basic</p><h2 id="feature-lock-title" className="mt-2 text-2xl font-semibold text-slate-950">{label}</h2><p className="mt-2 max-w-xl text-slate-700">This section stays available in your workspace. Upgrade to Basic to create and view these records.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-green-800 px-5 font-semibold text-white hover:bg-green-900" href="/plans">Compare plans</Link></section>;
  }
  return <>{children}</>;
}

// Limit gate component
export function LimitGate({ 
  limit, 
  current, 
  children, 
  fallback = null 
}: { 
  limit: 'goats' | 'scans';
  current: number;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { getLimit, tier } = useTier();
  const max = getLimit(limit);
  
  if (max >= 0 && current >= max) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-semibold text-red-800 mb-1">{limit === 'goats' ? 'Goat Limit Reached' : 'Scan Limit Reached'}</h3>
        <p className="text-red-700 text-sm mb-4">
          Your {tier} plan allows {max} {limit}. Upgrade to add more.
        </p>
        {fallback}
      </div>
    );
  }
  return <>{children}</>;
}