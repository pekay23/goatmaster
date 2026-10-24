'use client';

import { ReactNode, useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { SyncIndicator } from '@/lib/context/SyncContext';
import { TierProvider } from '@/lib/context/TierContext';
import { SyncProvider } from '@/lib/context/SyncContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'Dashboard', icon: Home },
  { href: '/app/herd', label: 'Herd', icon: Users },
  { href: '/app/health', label: 'Health', icon: Heart },
  { href: '/app/breeding', label: 'Breeding', icon: Baby },
  { href: '/app/inventory', label: 'Inventory', icon: Package },
  { href: '/app/scan', label: 'Scan', icon: Camera },
];

export function AppProviders({ children, orgId }: { children: ReactNode; orgId: string }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

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

export function AppLayout({ children, orgId }: { children: ReactNode; orgId: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <AppProviders orgId={orgId}>
      <div className="app-layout min-h-screen-dvh flex bg-bg-app text-text-main">
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
              <h1 className="font-serif text-xl font-bold text-primary">GoatMaster</h1>
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
                href="/app/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-sub hover:bg-primary-bg hover:text-primary transition-colors min-h-[48px]"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
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
                <h1 className="font-serif text-xl font-bold text-text-main hidden sm:block">GoatMaster</h1>
              </div>
              <div className="flex items-center gap-3">
                <SyncIndicator />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-8">
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