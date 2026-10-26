import Link from 'next/link';

export default function MarketingNav({ demo = false }: { demo?: boolean }) {
  const records = demo ? '/#records' : '#records';
  const plans = demo ? '/#plans' : '#plans';
  return <header className="marketing-nav">
    <Link className="marketing-brand" href="/" aria-label="GoatMaster home"><span className="brand-mark" aria-hidden="true">G</span><span>GoatMaster</span></Link>
    <nav className="marketing-nav-links" aria-label="Main navigation"><Link href={records}>The records</Link><Link href="/demo">Explore a sample farm</Link><Link href={plans}>Plans</Link><Link href="/login">Sign in</Link></nav>
    <div className="marketing-nav-actions"><Link className="nav-cta" href="/signup">Create an account</Link><details className="marketing-mobile-menu"><summary aria-label="Open navigation"><span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation"><Link href={records}>The records</Link><Link href="/demo">Sample farm</Link><Link href={plans}>Plans</Link><Link href="/login">Sign in</Link><Link href="/signup">Create an account</Link></nav></details></div>
  </header>;
}
