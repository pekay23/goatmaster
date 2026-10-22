'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pathname: string;
  userName?: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'Dashboard' },
  { href: '/admin/users', label: 'Users', icon: 'Users' },
  { href: '/admin/tiers', label: 'Tiers', icon: 'Layers' },
];

export function AdminSidebar({ isCollapsed, onToggleCollapse, pathname, userName }: AdminSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-bg-nav">
      <div className={`min-h-16 flex border-b border-border ${isCollapsed ? 'flex-col items-center justify-center gap-3 py-3' : 'items-center pr-4'}`}>
        {isCollapsed ? (
          <Link href="/admin" className="shrink-0" aria-label="Goat Master Admin">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h10z" />
            </svg>
          </Link>
        ) : (
          <Link href="/admin" className="min-w-0 shrink-0 mr-8 pl-5" aria-label="Goat Master Admin">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h10z" />
              </svg>
              <span className="text-sm font-black tracking-widest text-primary uppercase truncate">Goat Master</span>
            </div>
          </Link>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-text-sub/30 hover:text-primary hover:bg-primary-bg transition-colors ${isCollapsed ? 'mt-2' : 'ml-auto'}`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto no-scrollbar py-3 ${isCollapsed ? 'px-2' : 'px-3'}`} aria-label="Admin navigation">
        <div className="space-y-1">
          {[
            { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { href: '/admin/tiers', label: 'Tiers', icon: 'M4 6h16M4 12h16M4 18h7' },
          ].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                window.location.pathname === item.href
                  ? 'bg-primary-bg text-primary font-semibold'
                  : 'text-text-sub hover:bg-primary-bg hover:text-primary'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="truncate">{['Dashboard', 'Users', 'Tiers'][i]}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-bg text-primary">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-text-main text-sm">Admin</p>
            <p className="text-[10px] text-text-sub">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}