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
  CreditCard,
  FileText,
} from 'lucide-react';
import { PortalHeader } from '@/components/admin/PortalHeader';
import { PageHeader } from '@/components/admin/PageHeader';
import { MobileBottomNav } from '@/components/admin/MobileBottomNav';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import { AdminQueryWrapper } from '@/components/app/AdminQueryWrapper';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sidebarRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              setSidebarCollapsed(true);
            } else {
              setSidebarCollapsed(false);
            }
          });
        },
        { threshold: 0 }
      );
      observer.observe(sidebarRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <AdminQueryWrapper>
      <div className="app-layout min-h-screen-dvh flex bg-bg-app text-text-main">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-out border-r border-border ${
            sidebarCollapsed
              ? 'w-16 lg:w-16'
              : 'w-[17rem] lg:w-[17rem]'
          } bg-bg-nav`}
        >
          <div className="flex flex-col h-full">
            {/* Logo / Brand */}
            <div className={`flex items-center justify-between h-16 px-4 border-b border-border ${sidebarCollapsed ? 'justify-center' : ''}`}>
              {!sidebarCollapsed && (
                <Link href="/admin" className="font-serif text-xl font-bold text-text-main">
                  GoatMaster
                </Link>
              )}
              <button
                className="p-2 rounded-lg text-text-sub hover:bg-bg-hover transition-colors lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation" aria-label="Admin navigation">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(href)
                      ? 'bg-primary-bg text-primary'
                      : 'text-text-sub hover:bg-bg-hover hover:text-text-main'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              ))}
            </nav>

            {/* Toggle Button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-sub hover:bg-bg-hover transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft size={18} />
                {!sidebarCollapsed && <span>Collapse</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex flex-1 min-w-0 flex-col h-screen-dvh transition-[margin-left] duration-200 ease-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[17rem]'}`}>
          {/* Portal Header (sticky top) */}
          <PortalHeader
            onMenuClick={() => setSidebarOpen(true)}
            userName="Admin"
          />

          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-y-auto overflow-x-clip no-scrollbar p-4 sm:p-5 lg:p-6 lg:pb-8">
            <ImpersonationBanner />
            {children}
          </main>

          {/* Mobile Bottom Nav */}
          <MobileBottomNav 
            items={NAV_ITEMS} 
            pathname={pathname} 
            onNavigate={() => {}} 
          />
        </div>
      </div>
    </AdminQueryWrapper>
  );
}