'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const partners = [
  { name: 'Ministry of Food & Agriculture', type: 'government', logo: '🏛️' },
  { name: 'Ghana Veterinary Medical Association', type: 'association', logo: '🩺' },
  { name: 'CSIR Animal Research Institute', type: 'research', logo: '🔬' },
  { name: 'University of Ghana - Vet School', type: 'academic', logo: '🎓' },
  { name: 'Heifer International Ghana', type: 'ngo', logo: '🤝' },
  { name: 'Savannah Agricultural Research', type: 'research', logo: '🌾' },
  { name: 'Ghana National Farmers Association', type: 'association', logo: '👨‍🌾' },
  { name: 'FAO Ghana', type: 'international', logo: '🌍' },
  { name: 'Kwame Nkrumah Univ. of Science', type: 'academic', logo: '⚗️' },
  { name: 'Ghana Expo 2023', type: 'event', logo: '🏆' },
  { name: 'AirtelTigo IoT', type: 'tech', logo: '📡' },
  { name: 'MTN MoMo', type: 'payments', logo: '💳' },
];

const integrations = [
  { name: 'Paystack', category: 'Payments', logo: '💳' },
  { name: 'Firebase', category: 'Push Notifications', logo: '🔔' },
  { name: 'Sentry', category: 'Error Tracking', logo: '🐛' },
  { name: 'Vercel', category: 'Hosting', logo: '▲' },
  { name: 'Fly.io', category: 'GPU Compute', logo: '☁️' },
  { name: 'PostgreSQL', category: 'Database', logo: '🐘' },
  { name: 'Redis', category: 'Caching', logo: '⚡' },
  { name: 'TensorFlow.js', category: 'On-Device ML', logo: '🧠' },
  { name: 'Ultralytics YOLOv8', category: 'Detection', logo: '🎯' },
  { name: 'pgvector', category: 'Vector Search', logo: '🔍' },
  { name: 'ConnectRPC', category: 'API Layer', logo: '🔗' },
  { name: 'Tailwind CSS', category: 'Styling', logo: '🎨' },
];

export default function Ecosystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        onEnter: () => {
          // Animate partner logos
          gsap.fromTo('.partner-logo', 
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.3)' }
          );

          // Animate integration logos
          gsap.fromTo('.integration-logo', 
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.3)', delay: 0.2 }
          );
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section id="ecosystem" ref={containerRef} className="py-24 md:py-32 lg:py-40 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            Our <span className="text-green-600">Ecosystem</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Built on trusted platforms. Partnered with institutions that matter.
          </p>
        </div>

        {/* Partners */}
        <div className="mb-20" data-gsap="fade-up">
          <h3 className="font-serif text-2xl font-bold text-slate-900 text-center mb-10">
            Institutional Partners
          </h3>
          <div 
            ref={partnersRef}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12 -mx-4 px-4"
          >
            {partners.map((partner, i) => (
              <div
                key={i}
                className="partner-logo flex flex-col items-center gap-2 px-4 py-6 min-w-[160px] transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-4xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 shadow-lg">
                  {partner.logo}
                </div>
                <span className="text-sm font-medium text-slate-700 text-center leading-tight">{partner.name}</span>
                <span className="text-xs text-slate-400 capitalize">{partner.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-16" data-gsap="fade-up">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">Technology Stack</span>
          </div>
        </div>

        {/* Integrations */}
        <div data-gsap="fade-up">
          <h3 className="font-serif text-2xl font-bold text-slate-900 text-center mb-10">
            Built With
          </h3>
          <div 
            ref={integrationsRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {integrations.map((integration, i) => (
              <div
                key={i}
                className="integration-logo group bg-white rounded-xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-green-50 transition-colors">
                    {integration.logo}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{integration.name}</p>
                    <p className="text-sm text-slate-500">{integration.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Source Badge */}
        <div className="mt-20 text-center" data-gsap="fade-up">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-semibold">Open Source Core</span>
            <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">MIT License</span>
          </div>
        </div>
      </div>
    </section>
  );
}