'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-white hover:bg-primary-hover': variant === 'default',
            'bg-destructive text-white hover:bg-destructive-hover': variant === 'destructive',
            'border border-border bg-transparent hover:bg-bg-elevated': variant === 'outline',
            'bg-bg-elevated text-text-main hover:bg-bg-elevated/80': variant === 'secondary',
            'hover:bg-bg-elevated hover:text-text-main': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-lg px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
            'h-10 w-10': size === 'icon-lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };