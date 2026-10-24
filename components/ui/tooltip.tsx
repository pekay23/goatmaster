'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

const TooltipContext = React.createContext<{
  delayDuration: number;
  openTooltip: (id: string) => void;
  closeTooltip: (id: string) => void;
} | null>(null);

export function TooltipProvider({ children, delayDuration = 100 }: TooltipProviderProps) {
  const [openTooltips, setOpenTooltips] = useState<Set<string>>(new Set());

  const openTooltip = (id: string) => {
    setOpenTooltips(prev => new Set(prev).add(id));
  };

  const closeTooltip = (id: string) => {
    setOpenTooltips(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <TooltipContext.Provider value={{ delayDuration, openTooltip, closeTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function Tooltip({ children, delayDuration = 100 }: TooltipProps) {
  return <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>;
}

export function TooltipTrigger({ asChild = false, children, ...props }: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext);
  const tooltipIdRef = useRef(`tooltip-${Math.random().toString(36).slice(2)}`); // eslint-disable-line react-hooks/purity
  
  if (!context) throw new Error('TooltipTrigger must be used within TooltipProvider');

  const Comp = asChild ? 'span' : 'div';
  const tooltipId = tooltipIdRef.current;

  const handleMouseEnter = () => {
    setTimeout(() => context.openTooltip(tooltipId), context.delayDuration);
  };

  const handleMouseLeave = () => {
    context.closeTooltip(tooltipId);
  };

  const handleFocus = () => context.openTooltip(tooltipId);
  const handleBlur = () => context.closeTooltip(tooltipId);

  return (
    <Comp
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </Comp>
  );
}

export function TooltipContent({
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  className,
  children,
  ...props
}: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  if (!context) throw new Error('TooltipContent must be used within TooltipProvider');

  // We need to find the trigger element by finding the parent TooltipTrigger
  // This is a simplified version - in reality you'd use a portal and position it
  // For now, we'll use a simple relative positioning approach

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 max-w-xs rounded-lg border border-border bg-bg-app px-3 py-1.5 text-xs text-text-sub shadow-lg animate-in fade-in-0 zoom-in-95 duration-150',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

TooltipContent.displayName = 'TooltipContent';
TooltipTrigger.displayName = 'TooltipTrigger';