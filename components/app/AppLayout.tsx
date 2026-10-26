'use client';

import { ReactNode, useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Heart,
  Baby,
  Package,
  Camera,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SyncIndicator } from '@/lib/context/SyncContext';
import { TierProvider } from '@/lib/context/TierContext';
import { SyncProvider } from '@/lib/context/SyncContext';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { track, identify } from '@/lib/analytics';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/herd', label: 'Herd', icon: Users },
  { href: '/health', label: 'Health', icon: Heart },
  { href: '/breeding', label: 'Breeding', icon: Baby },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/scan', label: 'Scan', icon: Camera },
];

export function AppProviders({ children, orgId, userId }: { children: ReactNode; orgId: string; userId: string }) {
  const expectedScope = orgId + ':' + userId;
  const scopeReady = useSyncExternalStore(callback => { window.addEventListener('goatmaster-scope-change',callback); return () => window.removeEventListener('goatmaster-scope-change',callback); }, () => localStorage.getItem('goatmaster-session-scope') === expectedScope, () => false);
  useEffect(() => { localStorage.setItem('goatmaster-session-scope',expectedScope); window.dispatchEvent(new Event('goatmaster-scope-change')); }, [expectedScope]);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      mutations: { networkMode: 'always' },
      queries: {
        networkMode: 'always',
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Register service worker for offline support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered for /:', registration.scope);
        })
        .catch((error) => {
          console.warn('SW registration failed:', error);
        });
    }
  }, []);

  // Identify user in PostHog
  useEffect(() => {
    identify(userId, { orgId });
  }, [userId, orgId]);

  if (!scopeReady) return <p role="status">Opening your farm…</p>;
  return (
    <QueryClientProvider client={queryClient}>
      <TierProvider orgId={orgId}>
        <SyncProvider>
          {children}
        </SyncProvider>
      </TierProvider>
    </QueryClientProvider>
  );
}

export function AppLayout({ children, orgId, userId }: { children: ReactNode; orgId: string; userId: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Track page views on SPA navigation
  useEffect(() => {
    track('page_view', { path: pathname });
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <AppProviders orgId={orgId} userId={userId}>
      <div className="app-layout min-h-screen-dvh flex bg-bg-app text-text-main">
        <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to main content</a>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-nav border-r border-border transform transition-transform duration-300 ease-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <button type="button" className="float-right min-h-11 min-w-11" aria-label="Close menu" onClick={()=>setSidebarOpen(false)}><X size={22}/></button>
              <h1 className="font-serif text-xl font-bold text-primary">GoatMaster</h1>
              <p className="mt-1 truncate pr-10 text-xs text-text-sub"><FarmName /></p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px] ${
                    isActive(href)
                      ? 'bg-primary-bg text-primary font-semibold'
                      : 'text-text-sub hover:bg-primary-bg hover:text-primary'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-sub hover:bg-primary-bg hover:text-primary transition-colors min-h-[48px]"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </aside>

        <aside className={'hidden shrink-0 flex-col border-r border-border bg-bg-nav transition-[width] duration-200 lg:flex ' + (sidebarCollapsed ? 'w-20 p-3' : 'w-60 p-4')}>
          <div className="mb-6 flex items-start justify-between gap-2">
            <div className={sidebarCollapsed ? 'sr-only' : 'min-w-0'}>
              <Link href="/dashboard" className="text-xl font-semibold">GoatMaster</Link>
              <p className="mt-1 truncate text-xs text-text-sub"><FarmName /></p>
            </div>
            <button type="button" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-text-sub hover:bg-primary-bg hover:text-primary" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
          </div>
          <nav aria-label="App navigation" className="space-y-2">{[...NAV_ITEMS, { href: '/settings', label: 'Settings', icon: Settings }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} title={sidebarCollapsed ? label : undefined} aria-current={isActive(href) ? 'page' : undefined} className={'flex min-h-11 items-center gap-3 rounded-lg py-3 text-sm ' + (sidebarCollapsed ? 'justify-center px-2' : 'px-4') + ' ' + (isActive(href) ? 'bg-primary-bg text-primary font-semibold' : 'text-text-sub hover:bg-primary-bg')}><Icon size={20}/><span className={sidebarCollapsed ? 'sr-only' : undefined}>{label}</span></Link>)}</nav>
        </aside>
        {/* Main Content */}
        <div className="flex flex-1 min-w-0 flex-col h-screen-dvh">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-bg-nav/80 backdrop-blur border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-lg text-text-sub hover:bg-primary-bg hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={24} />
                </button>
                <div className="hidden min-w-0 sm:block"><h1 className="font-serif text-xl font-bold text-text-main"><FarmName /></h1><p className="text-xs text-text-sub">Farm workspace</p></div>
              </div>
              <div className="flex items-center gap-3">
                <SyncIndicator />
              </div>
            </div>
          </header>

          {/* Content */}
          <main id="app-main" className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-8">
            {children}
          </main>

          {/* Bottom Nav (Mobile) */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-nav border-t border-border">
            <div className="grid grid-cols-3 gap-1 p-2">
              {NAV_ITEMS.slice(0, 3).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[44px] ${
                    isActive(href)
                      ? 'text-primary'
                      : 'text-text-sub'
                  }`}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 px-2 pb-2">
              {NAV_ITEMS.slice(3, 6).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[44px] ${
                    isActive(href)
                      ? 'text-primary'
                      : 'text-text-sub'
                  }`}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </AppProviders>
  );
}

function FarmName() {
  const profile = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/app/settings');
      if (!response.ok) throw new Error('Unable to load farm name');
      return response.json() as Promise<{ organization?: { name?: unknown } }>;
    },
    staleTime: 60_000,
  });
  const name = profile.data?.organization?.name;
  const displayName = typeof name === 'string' ? name.trim().replace(/(?:'s|’s)\s+Farm$/i, '').trim() : '';
  return <span title={displayName || undefined}>{displayName || 'Your farm'}</span>;
}
