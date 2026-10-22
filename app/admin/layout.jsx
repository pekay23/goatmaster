'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Users, Layers, ArrowLeft, Shield } from 'lucide-react';
import './admin.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/tiers', label: 'Tiers', icon: Layers },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Hydrate user from localStorage on the client only.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('goat_user');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <div className="admin-layout min-h-screen-dvh flex flex-col bg-bg-app text-text-main">
      <header className="admin-header sticky top-0 z-100 flex items-center justify-between px-5 py-3.5 bg-bg-nav border-b border-border backdrop-blur-20 -backdrop-blur-20">
        <div className="admin-header-left flex items-center gap-3">
          <Link href="/" className="admin-back inline-flex items-center gap-1 text-xs text-primary no-underline rounded px-2.5 py-1.5 transition-colors duration-75 hover:bg-primary-bg">
            <ArrowLeft size={14} className="shrink-0" /> App
          </Link>
          <h1 className="text-sm font-bold m-0 flex items-center gap-2">
            <Shield size={16} className="shrink-0" /> Admin
          </h1>
        </div>
        {user && (
          <span className="admin-user text-xs text-text-sub flex items-center gap-1.5 suppress-hydration-warning">
            <span className="admin-user-avatar w-7 h-7 rounded-full bg-primary-bg text-primary flex items-center justify-center text-[0.75rem] font-bold">
              {(user.username || 'A')[0].toUpperCase()}
            </span>
            {user.username}
          </span>
        )}
      </header>

      <main className="admin-content flex-1 w-full max-w-[var(--content-max)] mx-auto p-4 animate-[adminFadeIn_0.3s_ease]">
        {children}
      </main>

      <nav className="admin-nav fixed bottom-0 left-0 right-0 z-100 flex justify-around bg-bg-nav border-t border-border px-0 py-2 [padding-bottom:env(safe-area-inset-bottom,8px)] backdrop-blur-20 -backdrop-blur-20">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-text-sub text-[11px] font-medium no-decoration transition-colors duration-150 hover:text-text-main hover:bg-bg-elevated ${isActive ? 'text-primary bg-primary-bg' : ''}`}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Desktop: sidebar nav (lg:) */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] max-w-[var(--sidebar-width)] flex-col justify-start items-stretch gap-1 p-6 pb-3 border-r border-border rounded-r-[1.5rem] overflow-y-auto box-shadow-[var(--shadow-sm)] lg:block">
        <div className="flex items-center text-sm font-black text-primary px-3 py-1 mb-3 border-b border-border letter-spacing-[-0.03em]">
          🐐 Goat Master
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex flex-row items-start justify-start gap-3 font-medium text-sm p-3 rounded-xl flex-none w-full text-left ${isActive ? 'bg-primary-bg text-primary font-bold' : 'text-text-sub hover:bg-primary-bg hover:text-primary'}`}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
            >
              <Icon size={20} className="shrink-0 mt-0.5" />
              {label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
