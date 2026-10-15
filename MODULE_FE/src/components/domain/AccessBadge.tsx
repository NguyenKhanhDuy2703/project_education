import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export interface AccessBadgeProps {
  label?: string;
  isProOnly?: boolean;
  type?: 'free' | 'pro' | 'custom';
  tone?: 'default' | 'secondary' | 'destructive';
  className?: string;
}

export function AccessBadge({
  label,
  isProOnly,
  type,
  tone = 'default',
  className = '',
}: AccessBadgeProps) {
  // If isProOnly flag is provided
  if (isProOnly !== undefined) {
    if (isProOnly) {
      return (
        <Badge
          variant="default"
          className={`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-semibold gap-1 text-[11px] px-2 py-0.5 ${className}`}
        >
          <Crown className="size-3 text-amber-500" />
          <span>PRO ONLY</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className={`bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium text-[11px] px-2 py-0.5 ${className}`}
      >
        Free
      </Badge>
    );
  }

  // Type-based rendering
  if (type === 'pro') {
    return (
      <Badge
        variant="default"
        className={`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold gap-1 text-[11px] px-2 py-0.5 ${className}`}
      >
        <Crown className="size-3 text-amber-500" />
        <span>{label || 'PRO'}</span>
      </Badge>
    );
  }

  if (type === 'free') {
    return (
      <Badge
        variant="secondary"
        className={`bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium text-[11px] px-2 py-0.5 ${className}`}
      >
        {label || 'Free'}
      </Badge>
    );
  }

  return (
    <Badge variant={tone} className={className}>
      {label || 'General'}
    </Badge>
  );
}
