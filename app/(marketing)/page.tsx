import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import PricingSection from '@/components/marketing/PricingSection';
import SampleFarmExplorer from '@/components/marketing/SampleFarmExplorer';
import ScrollReveals from '@/components/marketing/ScrollReveals';

export const metadata: Metadata = {
  title: { absolute: 'GoatMaster | A clearer view of the herd' },
  description: 'Keep goat profiles, health records, breeding history, and farm inventory together. Explore a sample GoatMaster farm before creating an account.',
};

const records = [
  { number: '01', name: 'Know the animal.', detail: 'A profile for the name, tag, breed, parentage, and notes that make each goat recognizable.', label: 'Herd records' },
  { number: '02', name: 'Keep the history.', detail: 'Health entries and breeding records stay connected to the animal they belong to.', label: 'Health and breeding' },
  { number: '03', name: 'See the next job.', detail: 'Review upcoming dates and farm events, then open the record you need for the work.', label: 'The day ahead' },
  { number: '04', name: 'Check the supplies.', detail: 'Record feed, equipment, and other stock. Keep low-stock items in view before they run out.', label: 'Farm inventory' },
];

export default function MarketingPage() {
  return <div className="marketing-page">
    <ScrollReveals/>
    <a className="marketing-skip" href="#marketing-main">Skip to content</a>
    <MarketingNav/>
    <main id="marketing-main">
      <section className="marketing-hero" aria-labelledby="hero-title">
        <div className="hero-copy" data-reveal><p className="hero-kicker"><span aria-hidden="true">✳</span> A working record for your farm</p><h1 id="hero-title">A clearer view of <span>the herd.</span></h1><p className="hero-description">The goat you know by name. The treatment you need to remember. The next job on the farm. Keep the details together with GoatMaster.</p><div className="hero-actions"><Link className="marketing-button" href="/demo">Explore a sample farm <span aria-hidden="true">↗</span></Link><Link className="marketing-text-link" href="/signup">Start your own record <span aria-hidden="true">→</span></Link></div><p className="hero-note">Herd profiles · health · breeding · inventory</p></div>
        <figure className="hero-image-wrap" data-reveal><div className="hero-image-frame"><Image src="/marketing/goat-portrait.jpg" alt="A young goat looking toward the camera" fill priority sizes="(max-width: 800px) 100vw, 48vw" className="hero-image"/></div><div className="hero-photo-note" aria-hidden="true"><span>FIELD NOTES</span><p>Good records start<br/>with the small details.</p></div><span className="hero-image-stamp" aria-hidden="true">Herd<br/>notes</span></figure>
      </section>
      <div className="marketing-section-rule" aria-hidden="true"><span>Made for the everyday work</span><span>Keep a record. Know what comes next.</span></div>
      <section className="product-section" id="product" aria-labelledby="product-title"><div className="product-heading" data-reveal><div><p className="section-kicker">Take a look inside</p><h2 id="product-title">One animal.<br/><em>A story you can follow.</em></h2></div><p>Meet Ama, a goat in our sample farm. Open her profile, read a health entry, or look at a planned pairing. Everything here is labelled sample data.</p></div><div className="product-preview-wrap" data-reveal><div className="product-preview-caption"><span className="sample-tag">SAM-001</span><span>Follow Ama through the record</span><span className="product-preview-hint">Try the tabs below <span aria-hidden="true">↓</span></span></div><SampleFarmExplorer compact/></div></section>
      <section className="record-section" id="records" aria-labelledby="records-title"><div className="record-intro" data-reveal><p className="section-kicker">The connected record</p><h2 id="records-title">The details belong together.</h2><p>Farm work moves between animals, dates, and supplies. Your records should be easy to follow across the same ground.</p><Link className="primary-link" href="/demo">See a day on the sample farm <span aria-hidden="true">↗</span></Link></div><div className="record-list">{records.map(record => <article className="record-row" key={record.number} data-reveal><span className="record-number" aria-hidden="true">{record.number}</span><div><p className="record-label">{record.label}</p><h3>{record.name}</h3><p>{record.detail}</p></div></article>)}</div></section>
      <section className="field-section" id="about" aria-labelledby="field-title"><figure className="field-photo" data-reveal><Image src="/marketing/goat-herd.jpg" alt="A herd of goats grazing in a green field" fill sizes="(max-width: 800px) 100vw, 56vw" className="field-image"/></figure><div className="field-copy" data-reveal><p className="section-kicker">From the field to the record</p><h2 id="field-title">Less to hold<br/>in your head.</h2><p>A name on a tag, a note after a check, a supply getting low. GoatMaster gives these details a place in the farm’s record.</p><p>Start with the animals you know. Add the history as you work.</p><Link className="field-link" href="/demo">Try the sample farm <span aria-hidden="true">↗</span></Link></div></section>
      <PricingSection/>
      <section className="marketing-start" aria-labelledby="start-title" data-reveal><p className="section-kicker">Your farm. Your record.</p><h2 id="start-title">Start with the<br/><em>first goat.</em></h2><div><Link className="marketing-button" href="/signup">Create an account <span aria-hidden="true">↗</span></Link><Link className="marketing-text-link" href="/login">Already have a farm? Sign in</Link></div></section>
    </main>
    <footer className="marketing-footer"><Link className="marketing-brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true">G</span><span>GoatMaster</span></Link><p>Herd records, kept together.</p><nav aria-label="Footer navigation"><Link href="/demo">Sample farm</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><a href="#hero-title">Back to top ↑</a></nav></footer>
  </div>;
}
