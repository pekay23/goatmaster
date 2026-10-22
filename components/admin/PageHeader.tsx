'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  backHref?: string;
  children?: React.ReactNode;
}

/** Consistent portal page heading with optional back button and actions slot. */
export function PageHeader({ title, subtitle, backHref, children }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between')}>
      <div className="min-w-0 flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 rounded-xl p-2 text-text-sub transition-colors duration-150 hover:bg-bg-elevated hover:text-text-main"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="shrink-0" />
          </Link>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
          </div>
          {subtitle && <div className="mt-1 text-sm text-text-sub">{subtitle}</div>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{children}</div>}
    </div>
  );
}