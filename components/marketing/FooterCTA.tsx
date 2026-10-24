'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, ArrowRight, Shield, Truck, RotateCcw, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  { icon: Shield, title: 'Secure', desc: 'Bank-grade encryption' },
  { icon: Truck, title: 'Fast Setup', desc: 'Deploy in 5 minutes' },
  { icon: RotateCcw, title: 'No Lock-in', desc: 'Export data anytime' },
  { icon: Globe, title: 'Works Offline', desc: 'No internet needed' },
];

export default function FooterCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.benefit-card', 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
          );
          
          gsap.fromTo('.cta-form', 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' }
          );
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    
    setStatus('loading');
    try {
      // In production, call your API
      await new Promise(r => setTimeout(r, 1000));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer id="cta" ref={containerRef} className="relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-900" />
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Benefits */}
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
              Ready to Transform Your <span className="text-yellow-300">Herd Management</span>?
            </h2>
            <p className="mt-6 text-lg text-green-100 max-w-xl">
              Join 500+ farmers across Ghana using GoatMaster. Start free, upgrade when you're ready.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="benefit-card flex items-start gap-4 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{benefit.title}</h4>
                    <p className="text-sm text-green-100 mt-1">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Signup Form */}
          <div className="cta-form">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="font-serif text-3xl font-bold text-slate-900">Start Your Free Trial</h3>
                <p className="mt-2 text-slate-600">No credit card. 14 days full access. Cancel anytime.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@farm.com"
                      disabled={status === 'loading' || status === 'success'}
                      className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success' || !email}
                  className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </>
                  ) : status === 'success' ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Account created! Check your email.
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <p className="text-center text-red-600 text-sm">Something went wrong. Please try again.</p>
                )}

                <p className="text-center text-sm text-slate-500">
                  By continuing, you agree to our{' '}
                  <a href="/legal/terms" className="underline hover:text-green-600">Terms</a>{' '}
                  and{' '}
                  <a href="/legal/privacy" className="underline hover:text-green-600">Privacy Policy</a>
                </p>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>5-min setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-green-600" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="lg:col-span-2 mt-16 pt-12 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-green-100">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#tiers" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/api/docs" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="/changelog" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-green-100">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-green-100">
                <li><a href="/legal/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/legal/terms" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="/legal/cookies" className="hover:text-white transition-colors">Cookies</a></li>
                <li><a href="/legal/dpa" className="hover:text-white transition-colors">DPA</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-green-100">
                <li><a href="https://twitter.com/goatmasterapp" className="hover:text-white transition-colors" target="_blank" rel="noopener">Twitter</a></li>
                <li><a href="https://linkedin.com/company/goatmaster" className="hover:text-white transition-colors" target="_blank" rel="noopener">LinkedIn</a></li>
                <li><a href="https://github.com/goatmaster" className="hover:text-white transition-colors" target="_blank" rel="noopener">GitHub</a></li>
                <li><a href="mailto:hello@goatmaster.com" className="hover:text-white transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-green-200 text-sm">
              © {new Date().getFullYear()} GoatMaster. Built with 💚 in Ghana.
            </p>
            <div className="flex items-center gap-6 text-sm text-green-200">
              <a href="/legal/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/legal/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/legal/cookies" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}