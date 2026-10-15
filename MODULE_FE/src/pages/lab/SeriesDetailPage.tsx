/**
 * SeriesDetailPage — /series/:slug
 *
 * Shows labs within a series; respects dynamic IAM permissions.
 * Workflow ref: Docs/workflows/02-lab-access-rbac.md
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Crown } from 'lucide-react';
import type { LabSummary } from '@/types/lab.types';

export function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLabTitle, setSelectedLabTitle] = useState<string>('');

  const { data: series, isLoading, isError } = useQuery({
    queryKey: ['series', slug],
    queryFn: () => seriesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const hasProAccess = can(user, 'LAB_PRO');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-destructive">Series not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/series">Back to series catalog</Link>
        </Button>
      </div>
    );
  }

  const handleOpenUpgrade = (labTitle: string) => {
    setSelectedLabTitle(labTitle);
    setUpgradeModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl space-y-7">
      {/* ── Series header ───────────────────────────────────────────────── */}
      <div className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider">
              {series.topic || 'Series'}
            </Badge>
            {series.isProOnly && (
              <Badge variant="secondary" className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 gap-1">
                <Crown className="size-3 text-amber-500" />
                PRO Tier
              </Badge>
            )}
          </div>
          {series.status && (
            <StatusBadge status={series.status} size="sm" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">{series.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{series.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>{series.totalLabs || series.labs?.length || 0} practice labs</span>
          <span>•</span>
          <span>~{series.estimatedMinutes || 60} mins to complete</span>
          {series.authorName && (
            <>
              <span>•</span>
              <span>Author: <strong className="text-foreground">{series.authorName}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* ── Lab list ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lab Curriculum
          </h2>
          <span className="text-xs text-muted-foreground">
            {series.labs?.length || 0} labs
          </span>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {series.labs?.map((lab, index) => (
            <LabRowItem
              key={lab.id}
              lab={lab}
              index={index}
              hasProAccess={hasProAccess}
              onUpgradeClick={() => handleOpenUpgrade(lab.title)}
            />
          ))}
        </div>
      </div>

      {/* Upgrade modal for locked labs */}
      <UpgradeModal
        open={upgradeModalOpen}
        labTitle={selectedLabTitle}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}

// ─── Lab Row Item ────────────────────────────────────────────────────────
function LabRowItem({
  lab,
  index,
  hasProAccess,
  onUpgradeClick,
}: {
  lab: LabSummary;
  index: number;
  hasProAccess: boolean;
  onUpgradeClick: () => void;
}) {
  const locked = lab.isProOnly && !hasProAccess;

  const renderStatus = () => {
    if (lab.userStatus === 'passed') {
      return (
        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
          PASSED
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 text-muted-foreground/60 font-medium">
        NOT STARTED
      </Badge>
    );
  };

  const content = (
    <div
      className={`flex items-center gap-4 px-4 py-3 bg-card transition-colors ${
        locked ? 'opacity-70 cursor-pointer bg-muted/10' : 'hover:bg-muted/40 cursor-pointer'
      }`}
      onClick={locked ? onUpgradeClick : undefined}
    >
      <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-center font-bold">
        {String(index + 1).padStart(2, '0')}
      </span>

      {renderStatus()}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{lab.title}</p>
        <p className="text-[11px] text-muted-foreground">{lab.estimatedMinutes} mins</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {lab.isProOnly && (
          <Badge variant="secondary" className="text-[10px] font-bold h-4.5 px-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
            PRO
          </Badge>
        )}
        {locked ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            onClick={(e) => {
              e.preventDefault();
              onUpgradeClick();
            }}
          >
            Unlock
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-primary">
            Start Lab
          </Button>
        )}
      </div>
    </div>
  );

  if (locked) {
    return <div key={lab.id}>{content}</div>;
  }

  return (
    <Link key={lab.id} to={`/labs/${lab.slug || lab.id}`}>
      {content}
    </Link>
  );
}
