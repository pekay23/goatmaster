'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Layers,
  ArrowLeft,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
} from 'lucide-react';
import { PortalHeader } from '@/components/admin/PortalHeader';
import { PageHeader } from '@/components/admin/PageHeader';
import { MobileBottomNav } from '@/components/admin/MobileBottomNav';
import './admin.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizations', label: 'Organizations', icon: Shield },
  { href: '/admin/tiers', label: 'Tiers', icon: Layers },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
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

  // Fetch user info from JWT cookie via API
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser({ username: data.username });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  // Keyboard accessibility for mobile sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const navItems = NAV_ITEMS;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-800 dark:focus:text-white"
      >
        Skip to main content
      </a>

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
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto no-scrollbar py-3 ${sidebarCollapsed ? 'px-2' : 'px-3'}`} aria-label="Admin navigation">
          <div className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
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
          onKeyDown={(e) => e.stopPropagation()} // Prevent key events from escaping
        />
      )}

      {/* Mobile Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-lg bg-bg-nav shadow-lg border border-border min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen}
      >
        <Menu size={24} className="text-text-main" />
      </button>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <PortalHeader
          onMenuClick={() => setSidebarOpen(true)}
          userName={user?.username}
        />
        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl p-4 duration-500 motion-reduce:animate-none motion-reduce:transition-none sm:p-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        items={navItems}
        pathname={pathname}
        onNavigate={(href) => router.push(href)}
      />
    </div>
  );
}
