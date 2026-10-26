import { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './renderMarkdown';

export type BugHintSeverity = 'critical' | 'major' | 'minor';

export interface BugHint {
  id: string;
  severity: BugHintSeverity;
  title?: string;
  content: string;
}

export interface BugHintsPanelProps {
  hints?: BugHint[] | string[] | null;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  BugHintSeverity,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    icon: ShieldAlert,
  },
  major: {
    label: 'Major',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: AlertTriangle,
  },
  minor: {
    label: 'Minor',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: Info,
  },
};

export function normalizeBugHints(rawHints?: BugHint[] | string[] | any[] | null): BugHint[] {
  if (!rawHints || !Array.isArray(rawHints)) return [];
  return rawHints.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `hint-${index + 1}`,
        severity: 'minor' as BugHintSeverity,
        title: `Hint ${index + 1}`,
        content: item,
      };
    }
    const rawSev = (item?.severity || 'minor').toLowerCase();
    const severity: BugHintSeverity =
      rawSev === 'critical' || rawSev === 'major' || rawSev === 'minor'
        ? (rawSev as BugHintSeverity)
        : 'minor';
    return {
      id: item?.id || `hint-${index + 1}`,
      severity,
      title: item?.title || `${severity.charAt(0).toUpperCase() + severity.slice(1)} Hint ${index + 1}`,
      content: item?.content || item?.hint || item?.description || '',
    };
  });
}

export function BugHintsPanel({ hints, className }: BugHintsPanelProps) {
  const normalized = normalizeBugHints(hints);
  const [openSections, setOpenSections] = useState<Record<BugHintSeverity, boolean>>({
    critical: false,
    major: false,
    minor: false,
  });

  if (normalized.length === 0) return null;

  const grouped: Record<BugHintSeverity, BugHint[]> = {
    critical: normalized.filter((h) => h.severity === 'critical'),
    major: normalized.filter((h) => h.severity === 'major'),
    minor: normalized.filter((h) => h.severity === 'minor'),
  };

  const toggleSection = (sev: BugHintSeverity) => {
    setOpenSections((prev) => ({
      ...prev,
      [sev]: !prev[sev],
    }));
  };

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-4 space-y-3.5', className)}
      data-testid="bug-hints-panel"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Categorized Bug Hints</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {normalized.length} {normalized.length === 1 ? 'hint' : 'hints'} available
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Try debugging on your own first! Hints are categorized by issue severity and collapsed by default.
      </p>

      <div className="space-y-2">
        {(['critical', 'major', 'minor'] as BugHintSeverity[]).map((severity) => {
          const items = grouped[severity];
          if (items.length === 0) return null;
          const config = SEVERITY_CONFIG[severity];
          const Icon = config.icon;
          const isOpen = openSections[severity];

          return (
            <div
              key={severity}
              className="rounded-lg border border-border/70 bg-muted/20 overflow-hidden transition-colors"
              data-testid={`hint-tier-${severity}`}
            >
              <button
                type="button"
                onClick={() => toggleSection(severity)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-medium hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={isOpen}
                aria-controls={`tier-content-${severity}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5" />
                  <Badge variant="outline" className={cn('text-[10px] font-bold px-1.5 py-0 h-4 uppercase', config.badgeClass)}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-foreground font-semibold">
                    {items.length} {items.length === 1 ? 'hint' : 'hints'}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div
                  id={`tier-content-${severity}`}
                  className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40"
                >
                  {items.map((hint) => (
                    <div
                      key={hint.id}
                      className="p-2.5 rounded-md bg-background border border-border/50 text-xs text-foreground space-y-1"
                      data-testid={`hint-item-${hint.id}`}
                    >
                      {hint.title && (
                        <h4 className="font-semibold text-foreground text-xs">{hint.title}</h4>
                      )}
                      <div
                        className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(hint.content) }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
