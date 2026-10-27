import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';

export default function LegalPage({ title, lastUpdated, sections, children }) {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link className="legal-brand" href="/" aria-label="GoatMaster home">
            <span className="legal-brand-mark"><Sprout size={20} strokeWidth={2.2} /></span>
            <span>GoatMaster</span>
          </Link>
          <nav className="legal-header-links" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link className="legal-signin-link" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="legal-layout">
        <header className="legal-title-block">
          <Link className="legal-back-link" href="/" aria-label="Back to GoatMaster home"><ArrowLeft size={16} /> GoatMaster home</Link>
          <p className="legal-eyebrow">Policies and service information</p>
          <h1>{title}</h1>
          <p className="legal-updated"><span className="legal-status-dot" aria-hidden="true" /> Last revised <time>{lastUpdated}</time></p>
        </header>

        <details className="legal-mobile-toc">
          <summary>On this page <span aria-hidden="true">＋</span></summary>
          <nav aria-label="On this page"><ol>{sections.map(section => <li key={section.id}><a href={'#' + section.id}>{section.label}</a></li>)}</ol></nav>
        </details>

        <div className="legal-reading-layout">
          <aside className="legal-sidebar">
            <nav className="legal-toc" aria-label="On this page">
              <h2>On this page</h2>
              <ol>{sections.map(section => <li key={section.id}><a href={'#' + section.id}>{section.label}</a></li>)}</ol>
            </nav>
          </aside>
          <article className="legal-document">
            <div className="legal-prose">{children}</div>
            <footer className="legal-document-footer">
              <span>Questions about this page?</span>
              <a href="mailto:samuel.hughes.23@outlook.com">Contact GoatMaster</a>
            </footer>
          </article>
        </div>
      </main>

      <footer className="legal-site-footer">
        <span>© {new Date().getFullYear()} GoatMaster</span>
        <nav aria-label="Legal pages"><Link href="/legal/privacy">Privacy Policy</Link><Link href="/legal/terms">Terms of Service</Link></nav>
      </footer>
    </div>
  );
}
