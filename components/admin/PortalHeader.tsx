'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Search, Menu, X, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PortalHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderNotification(notification: Notification) {
  return (
    <button
      key={notification.id}
      type="button"
      className="flex min-h-20 w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors duration-150 hover:bg-bg-elevated"
      onClick={() => {
        if (notification.link) window.location.href = notification.link;
      }}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-bg text-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate text-sm font-bold text-text-main">{notification.title}</span>
          <span className="shrink-0 text-[11px] text-text-sub">{formatNotificationTime(notification.createdAt)}</span>
        </span>
        {notification.message && (
          <span className="mt-1 line-clamp-2 block text-xs text-text-sub">{notification.message}</span>
        )}
      </span>
    </button>
  );
}

function renderNotificationList(notifications: Notification[]) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="size-8 text-text-sub/40">🔔</div>
        <div>
          <p className="text-sm font-bold text-text-main">No notifications</p>
          <p className="mt-1 text-xs text-text-sub">New work, requests, and system updates will land here.</p>
        </div>
      </div>
    );
  }
  return notifications.map(renderNotification);
}

export function PortalHeader({ onMenuClick, userName }: PortalHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isRootPage = pathname === '/admin' || pathname === '/admin/users' || pathname === '/admin/tiers';
  const showBack = !isRootPage && pathname.split('/').filter(Boolean).length > 1;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommand(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!showCommand) {
      const delay = setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(delay);
    }
  }, [showCommand]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {}
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) setNotifications(await res.json());
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) });
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  const navigateTo = (href: string) => {
    router.push(href);
  };

  // Pre-compute notification content to avoid JSX ternary issues
  const notificationContent = renderNotificationList(notifications);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 flex w-full flex-col border-b border-border/70 bg-bg-nav/95 supports-backdrop-filter:bg-bg-nav/85 supports-backdrop-filter:backdrop-blur">
        <div className="flex min-h-16 w-full items-center justify-between px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden sm:gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-text-sub hover:bg-bg-elevated hover:text-text-main"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="truncate font-bold text-base text-text-main lg:hidden">Goat Master Admin</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="hidden h-9 min-w-[14rem] justify-start gap-2 bg-bg-app px-3 text-text-sub md:inline-flex"
                  onClick={() => setShowCommand(true)}
                  aria-label="Open command palette"
                >
                  <Search size={16} />
                  <span className="text-sm">Search or jump to...</span>
                  <span className="ml-auto rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-sub">
                    Ctrl K
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Press Cmd+K to search</TooltipContent>
            </Tooltip>

            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-text-sub hover:bg-bg-elevated hover:text-text-main"
              onClick={() => setShowCommand(true)}
              aria-label="Open command palette"
            >
              <Search size={20} />
            </button>

            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative p-2 rounded-lg text-text-sub hover:bg-bg-elevated hover:text-text-main"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-bg-app" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl p-0">
                <div className="flex items-center justify-between border-b border-border bg-bg-elevated/40 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-bold text-text-main">Notifications</h2>
                    <p className="text-xs text-text-sub">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-text-sub hover:text-text-main hover:underline"
                      onClick={() => markAsRead()}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[28rem] overflow-y-auto">
                  {renderNotificationList(notifications)}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}