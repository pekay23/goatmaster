'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function ImpersonationBanner() {
  const [session, setSession] = useState<{ organization: { name: string; slug: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/impersonate')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSession(data?.session ?? null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !session) return null;

  const stopImpersonation = async () => {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-4 py-2 bg-amber-900/90 text-amber-100 border-b border-amber-700 text-sm font-medium">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} />
        <span>
          Viewing as <strong>{session.organization.name}</strong> ({session.organization.slug}) &mdash; support impersonation
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1 underline underline-offset-2 hover:text-white transition-colors"
      >
        <LogOut size={14} /> Stop impersonating
      </button>
    </div>
  );
}
