'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface MobileBottomNavProps {
  items: NavItem[];
  pathname: string;
  onNavigate: (href: string) => void;
}

export function MobileBottomNav({ items, pathname, onNavigate }: MobileBottomNavProps) {
  const isActive = (item: NavItem) => pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-bg-nav/95 supports-backdrop-filter:bg-bg-nav/80 supports-backdrop-filter:backdrop-blur"
      aria-label="Admin primary navigation"
    >
      {items.slice(0, 4).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 mx-1 my-1 rounded-2xl text-[10px] font-medium leading-tight transition-colors',
              active
                ? 'bg-primary-bg text-primary'
                : 'text-text-sub hover:text-text-main hover:bg-bg-elevated'
            )}
          >
            <item.icon size={20} className="shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 mx-1 my-1 rounded-2xl text-[10px] font-medium leading-tight text-text-sub transition-colors hover:text-text-main hover:bg-bg-elevated"
        aria-label="Open full menu"
      >
        <Menu size={20} className="shrink-0" />
        <span>More</span>
      </button>
    </nav>
  );
}