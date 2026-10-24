'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: '📱',
    title: 'Smart Scan',
    description: 'Point your camera at any goat. AI identifies it instantly using facial recognition — even offline.',
    highlight: 'Works offline',
  },
  {
    icon: '🧬',
    title: 'Lineage AI',
    description: 'Automatic pedigree tracking with inbreeding alerts. Smart breeding recommendations for healthier herds.',
    highlight: 'Auto-generated',
  },
  {
    icon: '🏥',
    title: 'Health Alerts',
    description: 'Vaccination schedules, treatment logs, disease outbreak warnings. Never miss a dose again.',
    highlight: 'Real-time',
  },
  {
    icon: '📴',
    title: 'Offline-First',
    description: 'Full functionality without internet. Data syncs automatically when you\'re back online.',
    highlight: 'Zero dependency',
  },
  {
    icon: '🌾',
    title: 'Nutrition AI',
    description: 'Ration calculator optimized for local feeds. Track feed costs vs weight gain per goat.',
    highlight: 'Cost-optimized',
  },
];

export default function FeaturesCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      if (isDesktop) {
        // Horizontal scroll with 3D card effect
        ScrollTrigger.create({
          trigger: container,
          start: 'top 80%',
          onEnter: () => {
            gsap.fromTo('.feature-card', 
              { opacity: 0, y: 40, rotateY: 15 },
              { opacity: 1, y: 0, rotateY: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out' }
            );
          },
        });
      } else {
        // Vertical stack reveal
        ScrollTrigger.create({
          trigger: container,
          start: 'top 80%',
          onEnter: () => {
            gsap.fromTo('.feature-card', 
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
            );
          },
        });
      }
    }, container);

    return () => ctx.revert();
  }, [isDesktop]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: index * (isDesktop ? 320 : containerRef.current.clientWidth),
        behavior: 'smooth',
      });
    }
  };

  const goPrev = () => goToSlide(Math.max(0, currentIndex - 1));
  const goNext = () => goToSlide(Math.min(features.length - 1, currentIndex + 1));

  return (
    <section id="features" ref={containerRef} className="py-24 md:py-32 lg:py-40 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            Features Built for <span className="text-green-600">Real Farms</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Every feature designed with Ghanaian farmers. No fluff, just tools that work.
          </p>
        </div>

        <div className="relative">
          {/* Desktop: Horizontal scroll with 3D cards */}
          {isDesktop && (
            <div className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4">
              <div className="flex gap-6 min-w-max" style={{ width: `${features.length * 320}px` }}>
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="feature-card relative flex-shrink-0 w-80 bg-white rounded-2xl p-6 shadow-lg border border-slate-100 transform-gpu perspective-1000 hover:shadow-xl transition-all duration-300"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 mb-4">{feature.description}</p>
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-green-600 bg-green-50 rounded-full">
                      {feature.highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: Vertical stack with swipe */}
          {!isDesktop && (
            <div className="space-y-4" onTouchStart={(e) => {}} onTouchEnd={(e) => {}}>
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="feature-card bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-3xl">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="mt-2 text-slate-600">{feature.description}</p>
                      <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold text-green-600 bg-green-50 rounded-full">
                        {feature.highlight}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation arrows (desktop only) */}
          {isDesktop && (
            <>
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
                aria-label="Previous feature"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex === features.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
                aria-label="Next feature"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Mobile indicator dots */}
          {!isDesktop && (
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-green-600' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to feature ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}