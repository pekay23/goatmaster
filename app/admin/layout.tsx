'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Layers,
  Activity,
  ArrowLeft,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PortalHeader } from '@/components/admin/PortalHeader';
import { PageHeader } from '@/components/admin/PageHeader';
import { MobileBottomNav } from '@/components/admin/MobileBottomNav';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import { AdminQueryProvider } from '@/components/admin/AdminQueryProvider';
import './admin.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/tiers', label: 'Tiers', icon: Layers },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
  { href: '/admin/billing', label: 'Billing', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const mountedRef = useRef(false);

  // Fetch user info from JWT cookie via API
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser({ username: data.username });
      })
      .catch(() => {});
  }, []);

  // Hydrate sidebar collapsed state is handled by lazy initializer above

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Mounted flag for hydration
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/tiers', label: 'Tiers', icon: Layers },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
    { href: '/admin/billing', label: 'Billing', icon: Shield },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Skip to main content link for accessibility
  const skipLink = (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 px-4 py-2 rounded bg-primary text-white font-medium"
    >
      Skip to main content
    </a>
  );

  return (
    <div className="admin-layout min-h-screen-dvh flex bg-bg-app text-text-main">
      {/* Skip to main content */}
      {skipLink}

      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 hidden border-r border-border bg-bg-nav transition-[width] duration-200 ease-out lg:flex lg:flex-col
          ${sidebarCollapsed ? 'w-16' : 'w-[17rem]'}`}
        aria-label="Admin navigation"
      >
        <div className={`min-h-16 flex border-b border-border ${sidebarCollapsed ? 'flex-col items-center justify-center gap-3 py-3' : 'items-center pr-4'}`}>
          {sidebarCollapsed ? (
            <Link href="/admin" className="shrink-0" aria-label="Goat Master Admin">
              <Shield size={24} className="text-primary" />
            </Link>
          ) : (
            <Link href="/admin" className="min-w-0 shrink-0 mr-8 pl-5" aria-label="Goat Master Admin">
              <div className="flex items-center gap-2">
                <Shield size={24} className="text-primary shrink-0" />
                <span className="text-sm font-black tracking-widest text-primary uppercase truncate">Goat Master</span>
              </div>
            </Link>
          )}

          {/* Collapse/Expand button */}
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              setSidebarOpen(false);
            }}
            className={`p-2 rounded-lg text-text-sub/30 hover:text-primary hover:bg-primary-bg transition-colors ${sidebarCollapsed ? 'mt-2' : 'ml-auto'} min-h-[44px] min-w-[44px] flex items-center justify-center`}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto no-scrollbar py-3 ${sidebarCollapsed ? 'px-2' : 'px-3'}`} aria-label="Admin navigation">
          <div className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150 min-h-[44px] ${
                    active
                      ? 'bg-primary-bg text-primary font-semibold'
                      : 'text-text-sub hover:bg-primary-bg hover:text-primary'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-border p-4 transition-all duration-300">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-bg text-primary">
                {(user.username || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-text-main text-sm">{user.username}</p>
                <p className="text-[10px] text-text-sub">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-lg bg-bg-nav shadow-lg border border-border min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={24} className="text-text-main" />
      </button>

{/* Main Content Area */}
        <div className={`flex flex-1 min-w-0 flex-col h-screen transition-[margin-left] duration-200 ease-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[17rem]'}`}>
          {/* Portal Header (sticky top) */}
          <PortalHeader
            onMenuClick={() => setSidebarOpen(true)}
            userName={user?.username}
          />

          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-y-auto overflow-x-clip no-scrollbar p-4 sm:p-5 lg:p-6 lg:pb-8">
            <ImpersonationBanner />
            <AdminQueryProvider>
              {children}
            </AdminQueryProvider>
          </main>

        {/* Footer inside portal — hidden on mobile where bottom nav owns the bottom edge */}
        <footer className="hidden border-t border-border/60 p-5 text-center lg:block">
          <p className="text-[11px] font-medium uppercase text-text-sub/70">
            © {new Date().getFullYear()} Goat Master
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Nav — thumb-zone navigation, hidden on desktop */}
      <MobileBottomNav
        items={navItems}
        pathname={pathname}
        onNavigate={(href) => router.push(href)}
      />
    </div>
  );
}