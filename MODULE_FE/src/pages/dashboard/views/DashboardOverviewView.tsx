import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Flame,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/features/preferences/i18n';

export function DashboardOverviewView() {
  const { t } = useI18n();
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: labApi.getDashboardStats,
  });

  const totalCompleted = stats?.totalCompleted ?? 0;
  const totalLabs = stats?.totalLabs ?? 0;
  const streakDays = stats?.streakDays ?? 0;
  const seriesProgress = stats?.seriesProgress ?? [];

  const completionPct =
    totalLabs > 0 ? Math.min(100, Math.round((totalCompleted / totalLabs) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.labsCompletedRatio', {
              completed: totalCompleted,
              total: totalLabs,
            })}
          </p>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{t('dashboard.loadError')}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7">
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* ── Stats grid (4 KPIs) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label={t('dashboard.completedLabs')}
          value={isLoading ? '…' : String(totalCompleted)}
          srDescription={t('dashboard.labsCompletedRatio', {
            completed: totalCompleted,
            total: totalLabs,
          })}
        />
        <StatCard
          icon={Layers}
          label={t('dashboard.totalLabs')}
          value={isLoading ? '…' : String(totalLabs)}
        />
        <StatCard
          icon={Flame}
          label={t('dashboard.dayStreak')}
          value={isLoading ? '…' : `${streakDays} days`}
        />
        <StatCard
          icon={BookOpen}
          label={t('dashboard.overallProgress')}
          value={isLoading ? '…' : `${completionPct}%`}
        >
          {/* Accessible part-to-whole progress bar */}
          <div
            className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2"
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${t('dashboard.overallProgress')}: ${completionPct}%`}
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </StatCard>
      </div>

      {/* ── Series progress ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('dashboard.seriesProgress')}</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border pt-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))
          ) : seriesProgress.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {t('dashboard.noData')}
            </div>
          ) : (
            seriesProgress.map((sp) => (
              <div key={sp.seriesId} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{sp.seriesTitle}</span>
                  <span className="text-muted-foreground font-medium">
                    {sp.completedLabs}/{sp.totalLabs} labs ({sp.percentComplete}%)
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={sp.percentComplete}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${sp.seriesTitle}: ${sp.percentComplete}% complete`}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${sp.percentComplete}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Continue learning quick start ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('dashboard.continueLearning')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 border-t border-border pt-4">
          <Link
            to="/series"
            className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors group"
          >
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {t('dashboard.catalogTitle')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('dashboard.catalogDesc')}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary flex items-center gap-1">
              {t('dashboard.browseCatalog')} <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  srDescription,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  srDescription?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center space-y-1">
        <Icon className="size-5 mx-auto text-primary" />
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {srDescription && <span className="sr-only">{srDescription}</span>}
        {children}
      </CardContent>
    </Card>
  );
}
