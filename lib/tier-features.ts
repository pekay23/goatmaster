import { createContext, useContext } from 'react';
import { hasFeature, type Tier } from './plan-entitlements';
export type { Tier } from './plan-entitlements';

export const TierContext = createContext<Tier>('free');

export function useTier(): Tier {
  return useContext(TierContext);
}

export function useTierFeature(feature: string): boolean {
  const tier = useContext(TierContext);
  return hasFeature(tier, feature);
}
