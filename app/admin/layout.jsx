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
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('goat_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-left">
          <Link href="/" className="admin-back"><ArrowLeft size={16} /> App</Link>
          <h1><Shield size={18} /> Admin</h1>
        </div>
        {user && (
          <span className="admin-user">
            <span className="admin-user-avatar">
              {(user.username || 'A')[0].toUpperCase()}
            </span>
            {user.username}
          </span>
        )}
      </header>

      <main className="admin-content">
        {children}
      </main>

      <nav className="admin-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={isActive ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
            >
              <Icon size={20} />
              {label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}