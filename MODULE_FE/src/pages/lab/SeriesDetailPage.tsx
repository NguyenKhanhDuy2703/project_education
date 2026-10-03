/**
 * SeriesDetailPage — /series/:slug
 *
 * Shows labs within a series; respects RBAC (shows lock icon for Pro labs).
 * Workflow ref: Docs/workflows/02-lab-access-rbac.md
 *
 * Design: Meta flat. Lock 🔒 = visual RBAC layer 1 (FE role check).
 */
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { useAppSelector } from '@/stores/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  ChevronLeft,
  Circle,
} from 'lucide-react';
import type { LabSummary } from '@/types/lab.types';

export function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAppSelector((s) => s.auth);

  const { data: series, isLoading, isError } = useQuery({
    queryKey: ['series', slug],
    queryFn: () => seriesApi.getBySlug(slug!),
    enabled: !!slug,
  });

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
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <p className="text-sm text-destructive">Không tìm thấy series này.</p>
      </div>
    );
  }

  const isPro = user?.role === 'userPro' || user?.role === 'admin';

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl space-y-7">
      {/* ── Back breadcrumb ─────────────────────────────────────────────── */}
      <Link
        to="/series"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-3.5" />
        Tất cả series
      </Link>

      {/* ── Series header ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="text-4xl">{series.coverEmoji ?? '📚'}</span>
          {series.isProOnly && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="size-3" /> Pro
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{series.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{series.description}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <PlayCircle className="size-3.5" />
            {series.totalLabs} bài lab
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            ~{series.estimatedMinutes} phút
          </span>
        </div>
      </div>

      {/* ── Lab list ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Danh sách bài lab</h2>
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {series.labs?.map((lab, index) => (
            <LabRow key={lab.id} lab={lab} index={index} isPro={isPro} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lab Row ──────────────────────────────────────────────────────────────────
function LabRow({
  lab,
  index,
  isPro,
}: {
  lab: LabSummary;
  index: number;
  isPro: boolean;
}) {
  const locked = lab.isProOnly && !isPro;

  const StatusIcon = () => {
    if (lab.userStatus === 'passed') return <CheckCircle2 className="size-4 text-green-600 shrink-0" />;
    return <Circle className="size-4 text-muted-foreground/40 shrink-0" />;
  };

  const rowContent = (
    <div
      className={`flex items-center gap-4 px-4 py-3 bg-card transition-colors ${
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'
      }`}
    >
      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-center">
        {String(index + 1).padStart(2, '0')}
      </span>
      <StatusIcon />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{lab.title}</p>
        <p className="text-[11px] text-muted-foreground">{lab.estimatedMinutes} phút</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {lab.isProOnly && (
          <Badge variant="secondary" className="text-[10px] gap-0.5 h-4 px-1.5">
            <Lock className="size-2.5" /> Pro
          </Badge>
        )}
        {locked ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <a href="/upgrade">Mở khóa</a>
          </Button>
        ) : (
          <span className="text-xs text-primary font-medium">Vào lab →</span>
        )}
      </div>
    </div>
  );

  if (locked) {
    return <div key={lab.id}>{rowContent}</div>;
  }

  return (
    <Link key={lab.id} to={`/labs/${lab.id}`}>
      {rowContent}
    </Link>
  );
}
