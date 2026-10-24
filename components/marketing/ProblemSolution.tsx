'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const problems = [
  {
    title: 'Lost Records',
    description: 'Paper notebooks get lost, damaged by rain, or eaten by goats. Years of breeding history vanish overnight.',
    icon: '📓',
  },
  {
    title: 'Unknown Lineage',
    description: 'Without pedigree tracking, inbreeding depresses productivity. You can\'t select the best breeding pairs.',
    icon: '🧬',
  },
  {
    title: 'Disease Guesswork',
    description: 'Health issues spotted too late. No vaccination schedules, no treatment history, no early warnings.',
    icon: '🏥',
  },
  {
    title: 'Blind Decisions',
    description: 'No data on weight gain, milk yield, or feed efficiency. You\'re farming on intuition, not insights.',
    icon: '📊',
  },
];

const solutions = [
  {
    title: 'Cloud + Offline Sync',
    description: 'Every record saved locally first, then synced when online. Your data survives rain, goats, and power cuts.',
    image: '/marketing/solution-1.svg',
  },
  {
    title: 'AI Pedigree Engine',
    description: 'Automatic lineage tracking with inbreeding alerts. Smart breeding recommendations maximize genetic diversity.',
    image: '/marketing/solution-2.svg',
  },
  {
    title: 'Smart Health Scanning',
    description: 'Photo-based AI detects illness early. Vaccination schedules, treatment logs, and outbreak alerts built in.',
    image: '/marketing/solution-3.svg',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Weight trends, milk curves, feed conversion ratios. Real-time insights to optimize every decision.',
    image: '/marketing/solution-4.svg',
  },
];

export default function ProblemSolution() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const problemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const solutionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          
          problems.forEach((_, i) => {
            const el = problemRefs.current[i];
            if (el) {
              const delay = i * 0.15;
              const opacity = Math.max(0, Math.min(1, (progress - delay) * 2));
              const y = (1 - opacity) * 40;
              gsap.set(el, { opacity, y });
            }
          });

          solutions.forEach((_, i) => {
            const el = solutionRefs.current[i];
            if (el) {
              const delay = i * 0.15;
              const opacity = Math.max(0, Math.min(1, (progress - delay) * 2));
              const y = (1 - opacity) * 40;
              gsap.set(el, { opacity, y });
            }
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section id="problem-solution" ref={sectionRef} className="py-24 md:py-32 lg:py-40 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            The Problem with <span className="text-green-600">Traditional Herd Management</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Farmers across Ghana lose goats, money, and time to outdated methods. Here's how we fix it.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Problems Column */}
          <div className="space-y-8">
            {problems.map((problem, i) => (
              <div
                key={i}
                ref={(el) => { problemRefs.current[i] = el; }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 opacity-0 translate-y-10"
                data-gsap="fade-up"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-3xl">
                    {problem.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">{problem.title}</h3>
                    <p className="mt-2 text-slate-600">{problem.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Solutions Column */}
          <div className="space-y-8">
            {solutions.map((solution, i) => (
              <div
                key={i}
                ref={(el) => { solutionRefs.current[i] = el; }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 opacity-0 translate-y-10"
                data-gsap="fade-up"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-3xl">
                    ✅
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">{solution.title}</h3>
                    <p className="mt-2 text-slate-600">{solution.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}