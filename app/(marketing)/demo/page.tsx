import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import SampleFarmExplorer from '@/components/marketing/SampleFarmExplorer';

export const metadata: Metadata = { title: 'Explore a sample farm', description: 'Explore GoatMaster with three illustrative sample farms. Browse animal profiles, health entries, breeding records, farm tasks, and inventory without creating an account.' };

export default function DemoPage() {
  return <div className="marketing-page demo-page"><a className="marketing-skip" href="#demo-main">Skip to sample farm</a><MarketingNav demo/><main id="demo-main" className="demo-main"><div className="demo-heading"><div><p className="section-kicker">A look inside GoatMaster</p><h1>Take a walk<br/><em>through the record.</em></h1></div><div><p>Explore a sample day on three illustrative farms. Try the work list, find an animal, and move between its records.</p><p className="demo-notice"><strong>This is a read-only demonstration.</strong> Names, farms, and records are sample data. No changes are saved and no customer data is loaded.</p></div></div><SampleFarmExplorer/><section className="demo-next"><div><h2>Ready for your own herd?</h2><p>Create an account to start recording your farm’s animals and daily work.</p></div><Link className="marketing-button" href="/signup">Create an account <span aria-hidden="true">↗</span></Link><Link className="marketing-text-link" href="/#plans">Compare plans</Link></section></main><footer className="marketing-footer"><Link className="marketing-brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true">G</span><span>GoatMaster</span></Link><p>Sample farms. Real product concepts.</p><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></nav></footer></div>;
}
