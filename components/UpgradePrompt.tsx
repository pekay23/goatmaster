import React from 'react';

export function UpgradePrompt({ feature, requiredTier = 'basic' }: { feature: string; requiredTier?: string }) {
  return (
    <div className="border rounded p-4 text-center">
      <p className="font-semibold">{feature} is a {requiredTier} feature.</p>
      <a href="/upgrade" className="text-blue-600 underline">Upgrade your plan</a>
    </div>
  );
}
