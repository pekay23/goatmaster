import { TierContext, type Tier } from '../lib/tier-features';

export function TierProvider({ tier, children }: { tier: Tier; children: React.ReactNode }) {
  return <TierContext.Provider value={tier}>{children}</TierContext.Provider>;
}
