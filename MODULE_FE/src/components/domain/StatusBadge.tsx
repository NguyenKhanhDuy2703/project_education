import type { ContentLifecycleStatus } from '@/types/lab.types';

interface StatusConfig {
  label: string;
  className: string;
  dotColor: string;
}

const STATUS_CONFIG: Record<ContentLifecycleStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground',
  },
  submitted: {
    label: 'Pending Review',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-500 animate-pulse',
  },
  changes_requested: {
    label: 'Changes Requested',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  },
  published: {
    label: 'Published',
    className: 'bg-primary/10 text-primary border-primary/30 font-semibold',
    dotColor: 'bg-primary',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    dotColor: 'bg-destructive',
  },
  archived: {
    label: 'Archived',
    className: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
    dotColor: 'bg-zinc-400',
  },
};

export interface StatusBadgeProps {
  status: ContentLifecycleStatus | string;
  showDot?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function StatusBadge({
  status,
  showDot = true,
  size = 'default',
  className = '',
}: StatusBadgeProps) {
  const normalized = (status as ContentLifecycleStatus) in STATUS_CONFIG
    ? (status as ContentLifecycleStatus)
    : 'draft';

  const config = STATUS_CONFIG[normalized];

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium select-none transition-colors ${config.className} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`size-1.5 rounded-full shrink-0 ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
