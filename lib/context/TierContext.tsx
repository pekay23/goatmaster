'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { query } from '@/lib/db';

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
  const [tier, setTier] = useState<string>('free');

  // Fetch tier from server
  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch(`/api/app/org/${orgId}/tier`);
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier || 'free');
        }
      } catch (e) {
        console.error('Failed to fetch tier:', e);
      }
    }
    fetchTier();
  }, [orgId]);

  const features: TierFeatures = {
    maxGoats: tier === 'free' ? 5 : tier === 'basic' ? 25 : -1,
    maxScansPerDay: tier === 'free' ? 10 : tier === 'basic' ? 100 : -1,
    aiTrainingEnabled: tier !== 'free',
    smartScanEnabled: tier === 'pro' || tier === 'enterprise',
    hasFeature: (feature: string) => {
      const map = FEATURE_MAP[feature];
      return map ? map[tier as keyof typeof map] ?? false : true;
    },
  };

  const canUseFeature = (feature: string) => features.hasFeature(feature);
  const getLimit = (limit: 'goats' | 'scans') => limit === 'goats' ? features.maxGoats : features.maxScansPerDay;

  return (
    <TierContext.Provider value={{ tier, features, isLoading: false, canUseFeature, getLimit }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}

// Feature gate component
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { canUseFeature, tier } = useTier();
  
  if (!canUseFeature(feature)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-semibold text-yellow-800 mb-1">Feature Unavailable</h3>
        <p className="text-yellow-700 text-sm mb-4">
          This feature requires a higher tier. You&apos;re on <strong>{tier}</strong>.
        </p>
        {fallback}
      </div>
    );
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
  
  if (max > 0 && current >= max) {
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