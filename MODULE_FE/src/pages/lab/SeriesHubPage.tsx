/**
 * SeriesHubPage — /series
 *
 * Public catalog of all lab series.
 * Workflow ref: Docs/workflows/02-lab-access-rbac.md (step 1: Public Catalog)
 *
 * Design: Meta flat — neutral bg, card surface, single-blue CTA.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ArrowRight, BookOpen, Clock } from 'lucide-react';

export function SeriesHubPage() {
  const { data: seriesList, isLoading, isError } = useQuery({
    queryKey: ['series'],
    queryFn: seriesApi.getAll,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-5xl space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Series Bài Lab</h1>
        <p className="text-sm text-muted-foreground">
          Chọn series phù hợp với lộ trình của bạn. Mỗi series là một chuỗi bài thực hành ngắn (15–30 phút/bài).
        </p>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {isLoading && <SeriesSkeleton />}
      {isError && (
        <p className="text-sm text-destructive">
          Không thể tải danh sách series. Vui lòng thử lại.
        </p>
      )}

      {seriesList && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {seriesList.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Series Card ──────────────────────────────────────────────────────────────
function SeriesCard({ series }: { series: import('@/types/lab.types').LabSeries }) {
  const levelLabel: Record<string, string> = {
    beginner: 'Nhập môn',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };

  return (
    <Link to={`/series/${series.slug}`} className="group focus-visible:outline-none">
      <Card className="h-full flex flex-col hover:border-primary/60 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-3xl" role="img" aria-label="series emoji">
              {series.coverEmoji ?? '📚'}
            </span>
            <div className="flex items-center gap-1.5">
              {series.isProOnly && (
                <Badge variant="secondary" className="text-[10px] gap-1 h-5 px-1.5">
                  <Lock className="size-2.5" /> Pro
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {levelLabel[series.level] ?? series.level}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
            {series.title}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed line-clamp-2 mt-1">
            {series.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-auto border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {series.totalLabs} bài lab
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            ~{series.estimatedMinutes} phút
          </span>
          <span className="flex items-center gap-1 text-primary font-medium">
            Vào học <ArrowRight className="size-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SeriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
