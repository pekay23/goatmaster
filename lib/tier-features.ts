import { createContext, useContext } from 'react';

export type Tier = 'free' | 'basic' | 'pro';

export const TIER_ORDER: Record<Tier, number> = { free: 0, basic: 1, pro: 2 };

export const TIER_FEATURES: Record<Tier, Set<string>> = {
  free: new Set(['goats', 'basic_reports']),
  basic: new Set(['goats', 'basic_reports', 'breeding', 'health_records', 'inventory']),
  pro: new Set(['goats', 'basic_reports', 'breeding', 'health_records', 'inventory', 'analytics', 'smart_scan', 'pedigree', 'export']),
};

export function hasFeature(tier: Tier, feature: string): boolean {
  return TIER_FEATURES[tier]?.has(feature) ?? false;
}

export const TierContext = createContext<Tier>('free');

export function useTier(): Tier {
  return useContext(TierContext);
}

export function useTierFeature(feature: string): boolean {
  const tier = useContext(TierContext);
  return hasFeature(tier, feature);
}
