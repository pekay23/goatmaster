'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const TIER_ORDER = ['free', 'basic', 'pro', 'enterprise'] as const;
type Tier = typeof TIER_ORDER[number];

const USD_TO_GHS = 15.5;

const tierFeatures: Record<Tier, { included: string[]; notIncluded: string[] }> = {
  free: {
    included: ['Up to 5 goats', 'Basic health records', 'Weight tracking', 'Offline access', 'Data export (CSV)'],
    notIncluded: ['Breeding records', 'AI scanning', 'Lineage tracking', 'Analytics', 'Priority support', 'API access'],
  },
  basic: {
    included: ['Up to 25 goats', 'Health + breeding records', 'Lineage tracking (3 gen)', 'Vaccination alerts', 'Weight/milk analytics', 'Offline sync', 'Email support'],
    notIncluded: ['AI scanning', 'Advanced analytics', 'API access', 'Custom branding', 'Priority support'],
  },
  pro: {
    included: ['Unlimited goats', 'AI smart scanning', 'Full pedigree (unlimited)', 'Advanced analytics', 'Feed optimization', 'API access', 'Priority support', 'Custom reports'],
    notIncluded: ['White-label', 'SSO', 'Dedicated support', 'SLA guarantee'],
  },
  enterprise: {
    included: ['Everything in Pro', 'White-label app', 'SSO/SAML', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'On-premise option', 'Training included'],
    notIncluded: [],
  },
};

const tierPrices = {
  free: { monthly: 0, annually: 0 },
  basic: { monthly: 99, annually: 990 },
  pro: { monthly: 299, annually: 2990 },
  enterprise: { monthly: 999, annually: 9990 },
};

export default function InteractiveTiers() {
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<'GHS' | 'USD'>('GHS');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.tier-card', 
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' }
          );
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  const getPrice = (tier: Tier) => {
    const price = isAnnual ? tierPrices[tier].annually : tierPrices[tier].monthly;
    if (currency === 'USD') {
      return Math.round(price / USD_TO_GHS);
    }
    return price;
  };

  const formatPrice = (tier: Tier) => {
    if (tier === 'free') return 'Free';
    const price = getPrice(tier);
    const symbol = currency === 'GHS' ? 'GHS' : '$';
    return `${symbol} ${price.toLocaleString()}`;
  };

  const allFeatures = [
    'Up to 5 goats',
    'Up to 25 goats',
    'Unlimited goats',
    'Basic health records',
    'Breeding records',
    'Lineage tracking (3 gen)',
    'Full pedigree (unlimited)',
    'Vaccination alerts',
    'Weight/milk analytics',
    'Advanced analytics',
    'Feed optimization',
    'AI smart scanning',
    'Offline sync',
    'Data export (CSV)',
    'API access',
    'Custom reports',
    'Email support',
    'Priority support',
    'Custom branding',
    'White-label app',
    'SSO/SAML',
    'Dedicated support',
    'SLA guarantee',
    'Custom integrations',
    'On-premise option',
    'Training included',
  ];

  return (
    <section id="tiers" ref={containerRef} className="py-24 md:py-32 lg:py-40 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            Simple, Transparent <span className="text-green-600">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            No hidden fees. No contracts. Switch tiers anytime. All prices in Ghana Cedis (GHS).
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12" data-gsap="fade-up" style={{ transitionDelay: '0.2s' }}>
          {/* Tier Selector */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {TIER_ORDER.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTier === tier
                    ? 'bg-white shadow-md text-green-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-4">
            <span className={!isAnnual ? 'font-semibold text-slate-900' : 'text-slate-500'}>Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className={isAnnual ? 'font-semibold text-slate-900' : 'text-slate-500'}>
              Annual <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">Save 17%</span>
            </span>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-1">
            {(['GHS', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currency === c
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIER_ORDER.map((tier) => {
            const price = getPrice(tier);
            const isSelected = selectedTier === tier;
            const features = tierFeatures[tier];
            
            return (
              <article
                key={tier}
                className={`relative tier-card rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                  isSelected
                    ? 'border-2 border-green-500 bg-green-50 shadow-xl ring-4 ring-green-500/10'
                    : 'border border-slate-200 bg-white hover:border-green-300 hover:shadow-lg'
                }`}
              >
                {tier === 'enterprise' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                    Best Value
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="font-serif text-2xl font-bold text-slate-900 capitalize">{tier}</h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="font-serif text-4xl md:text-5xl font-bold text-slate-900">{formatPrice(tier)}</span>
                    <span className="text-slate-500">/{isAnnual ? 'yr' : 'mo'}</span>
                  </div>
                  {tier !== 'free' && (
                    <p className="mt-2 text-sm text-slate-500">
                      {isAnnual ? `GHS ${Math.round(price / 12).toLocaleString()}/mo equivalent` : ''}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8" role="list">
                  {features.included.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-700">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {features.notIncluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-400 line-through">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="w-full">
                  {tier === 'free' ? (
                    <a
                      href="https://app.goatmaster.com/signup"
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Start Free
                    </a>
                  ) : tier === 'enterprise' ? (
                    <button className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors">
                      Contact Sales
                    </button>
                  ) : (
                    <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                      Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Feature Matrix Toggle */}
        <details className="mt-16 max-w-4xl mx-auto" data-gsap="fade-up">
          <summary className="cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-green-600 font-medium">
            <span>View full feature comparison matrix</span>
            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 sticky left-0 bg-white z-10">Feature</th>
                  {TIER_ORDER.map((tier) => (
                    <th key={tier} className="px-4 py-3 text-center font-semibold text-slate-900 capitalize">{tier}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-700 sticky left-0 bg-white z-10">{feature}</td>
                    {TIER_ORDER.map((tier) => {
                      const features = tierFeatures[tier as Tier];
                      const hasFeature = features.included.includes(feature);
                      return (
                        <td key={tier} className="px-4 py-3 text-center">
                          {hasFeature ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <svg className="w-5 h-5 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}