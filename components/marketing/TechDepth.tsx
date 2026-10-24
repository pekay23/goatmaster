'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, ExternalLink, Shield, Database, Cpu, WifiOff, Zap, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const techTopics = [
  {
    icon: Shield,
    title: 'Security & Privacy',
    summary: 'End-to-end encryption, role-based access, and data sovereignty for Ghana.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>Encryption:</strong> AES-256 at rest, TLS 1.3 in transit. All data encrypted before leaving your device.</p>
        <p><strong>Authentication:</strong> JWT with httpOnly cookies, short-lived access tokens, refresh token rotation. Optional 2FA via TOTP.</p>
        <p><strong>Authorization:</strong> Row-level security (RLS) in PostgreSQL. Every query automatically scoped to your organization. Impossible to access another farm&apos;s data.</p>
        <p><strong>Data Residency:</strong> Primary database in Ghana (AWS Cape Town region). Backups replicated to EU for disaster recovery only.</p>
        <p><strong>Compliance:</strong> GDPR-ready with data export/deletion. Ghana Data Protection Act aligned. Audit logs immutable for 7 years.</p>
      </div>
    ),
  },
  {
    icon: Database,
    title: 'Offline-First Architecture',
    summary: 'Full CRUD offline with conflict-free sync using vector clocks and last-writer-wins.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>Local Storage:</strong> IndexedDB via idb wrapper. Entire org data cached (~50MB typical). Works completely offline.</p>
        <p><strong>Sync Engine:</strong> Vector clocks per entity. Last-writer-wins with manual merge for conflicts. Background sync when online.</p>
        <p><strong>Conflict Resolution:</strong> Automatic for non-overlapping edits. UI prompts for true conflicts (same goat edited offline on two devices).</p>
        <p><strong>Queue Management:</strong> Outbox pattern with exponential backoff. Priority queue for critical data (health alerts, breeding).</p>
        <p><strong>Recovery:</strong> Full state reconstruction from server. Local-first means zero data loss on device failure.</p>
      </div>
    ),
  },
  {
    icon: Cpu,
    title: 'AI Models',
    summary: 'On-device TensorFlow.js for scanning. Server-side YOLOv8 + ResNet50 with pgvector for recognition.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>On-Device (Mobile):</strong> MobileNetV3 quantized to 8-bit (~4MB). Runs in WebWorker. 50ms inference on mid-range phones. Zero network required.</p>
        <p><strong>Server-Side Detection:</strong> YOLOv8n fine-tuned on goat/sheep/cow dataset. Detects goat in frame, crops to face region.</p>
        <p><strong>Recognition:</strong> ResNet50 triplet-loss embeddings (1024-d → 128-d). Stored in pgvector (PostgreSQL extension). Cosine similarity search.</p>
        <p><strong>Training Pipeline:</strong> Automatic fine-tuning when org has 10+ photos/goat for 2+ goats. Runs on GPU (Fly.io). Nightly batch jobs.</p>
        <p><strong>Fallback:</strong> If confidence { '<' } 0.7, returns top 3 matches for manual selection. Continuous learning from corrections.</p>
      </div>
    ),
  },
  {
    icon: WifiOff,
    title: 'Connectivity & Sync',
    summary: 'Adaptive sync for 2G/3G/4G/WiFi. Background sync with battery awareness.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>Network Detection:</strong> Navigator.connection API + periodic probes. Adapts sync frequency: WiFi=real-time, 4G=5min, 3G=15min, 2G=manual.</p>
        <p><strong>Data Compression:</strong> Protocol Buffers (ConnectRPC) for API. Delta sync — only changed fields. Images compressed to WebP (80% quality).</p>
        <p><strong>Battery Awareness:</strong> Page Visibility API + Battery Status API. Pauses sync when battery { '<' } 20% or background tab.</p>
        <p><strong>Offline Queue:</strong> Persistent outbox in IndexedDB. Auto-flush on connectivity. Max 1000 pending ops (oldest evicted if full).</p>
        <p><strong>Conflict-Free:</strong> CRDT-inspired for counters (goat counts). Operational transforms for text notes. Vector clocks for entities.</p>
      </div>
    ),
  },
  {
    icon: Zap,
    title: 'Performance',
    summary: 'Sub-100ms interactions. Static marketing. ISR for blog. Edge caching globally.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>Marketing:</strong> Static export (next export). CDN cached globally. Zero server cost. Lighthouse 100/100.</p>
        <p><strong>App:</strong> Next.js App Router with RSC. Critical CSS inlined. Code-split by route. Prefetch on hover.</p>
        <p><strong>API:</strong> ConnectRPC (gRPC-Web) with protobuf. 10x smaller than JSON. Connection pooling (PgBouncer).</p>
        <p><strong>Database:</strong> Read replicas for analytics. Materialized views for dashboards. Connection pooling (100 max).</p>
        <p><strong>Monitoring:</strong> Vercel Analytics + Speed Insights. Sentry for errors. Custom metrics for sync latency.</p>
      </div>
    ),
  },
  {
    icon: Lock,
    title: 'Multi-Tenancy',
    summary: 'Shared database, shared schema, row-level security. Zero data leakage.',
    details: (
      <div className="space-y-4 text-slate-600">
        <p><strong>Model:</strong> Single PostgreSQL database. All tables have <code>org_id</code>. RLS policies enforce isolation at DB level.</p>
        <p><strong>Middleware:</strong> Next.js middleware extracts org from subdomain (<code>org.app.goatmaster.com</code>). Sets <code>SET LOCAL app.current_org_id</code> per request.</p>
        <p><strong>JWT Claims:</strong> Token includes <code>org_id</code>, <code>org_role</code>, <code>tier</code>. Verified on every request.</p>
        <p><strong>Admin Impersonation:</strong> Time-limited (1hr) JWT with <code>act_as</code> claim. Fully audited. Original admin retains accountability.</p>
        <p><strong>Custom Domains:</strong> CNAME verification. SSL via Let&apos;s Encrypt. Subdomain takeover protection.</p>
      </div>
    ),
  },
];

export default function TechDepth() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.tech-card', 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
          );
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="tech-depth" ref={containerRef} className="py-24 md:py-32 lg:py-40 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            Technical <span className="text-green-600">Deep Dive</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            For the engineers who want to know how it works under the hood.
          </p>
        </div>

        <div className="space-y-4">
          {techTopics.map((topic, i) => (
            <article
              key={i}
              className="tech-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full px-6 py-5 flex items-center gap-4 text-left focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-expanded={openIndex === i}
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <topic.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-serif text-xl font-bold text-slate-900">{topic.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{topic.summary}</p>
                </div>
                <ChevronDown 
                  className={`w-6 h-6 text-slate-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: openIndex === i ? '500px' : '0',
                  opacity: openIndex === i ? 1 : 0,
                  paddingTop: openIndex === i ? '0' : '0',
                  paddingBottom: openIndex === i ? '24px' : '0',
                }}
              >
                <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50">
                  {topic.details}
                  <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-4 text-sm text-slate-500">
                    <a href="#" className="flex items-center gap-1 hover:text-green-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      View source on GitHub
                    </a>
                    <a href="#" className="flex items-center gap-1 hover:text-green-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      API docs
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}