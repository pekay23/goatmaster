'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SubscriptionStatusBadgeProps {
  status: 'active' | 'past_due' | 'cancelled' | 'trialing' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  active: { label: 'Active', variant: 'success' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  trialing: { label: 'Trialing', variant: 'default' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function SubscriptionStatusBadge({ 
  status, 
  size = 'md', 
  className 
}: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' };
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(sizeClasses[size], className)}
    >
      {config.label}
    </Badge>
  );
}