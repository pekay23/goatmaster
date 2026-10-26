'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
}

export function Popover({ children, open, onOpenChange }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverProvider value={{ isOpen, setIsOpen: handleOpenChange }}>
      {children}
    </PopoverProvider>
  );
}

const PopoverContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

function PopoverProvider({ children, value }: { children: React.ReactNode; value: { isOpen: boolean; setIsOpen: (open: boolean) => void } }) {
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

export function PopoverTrigger({ asChild = false, children, ...props }: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');

  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp
      {...props}
      onClick={(e) => {
        context.setIsOpen(!context.isOpen);
        props.onClick?.(e);
      }}
      aria-expanded={context.isOpen}
      aria-haspopup="dialog"
    >
      {children}
    </Comp>
  );
}

export function PopoverContent({
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  alignOffset = 0,
  className,
  children,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within Popover');
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context.isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') context.setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context]);

  if (!context.isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'fixed z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-border bg-bg-app p-0 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PopoverTrigger.displayName = 'PopoverTrigger';
PopoverContent.displayName = 'PopoverContent';