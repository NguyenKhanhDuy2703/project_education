import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Flame,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export function DashboardOverviewView() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: labApi.getDashboardStats,
  });

  const completionPct =
    stats && stats.totalLabs > 0
      ? Math.round((stats.totalCompleted / stats.totalLabs) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Completed Labs"
          value={isLoading ? '…' : String(stats?.totalCompleted ?? 0)}
        />
        <StatCard
          icon={Layers}
          label="Total Labs"
          value={isLoading ? '…' : String(stats?.totalLabs ?? 0)}
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={isLoading ? '…' : `${stats?.streakDays ?? 0} days`}
        />
        <StatCard
          icon={BookOpen}
          label="Overall Progress"
          value={isLoading ? '…' : `${completionPct}%`}
        />
      </div>

      {/* ── Series progress ──────────────────────────────────────────────── */}
      {(isLoading || (stats?.seriesProgress ?? []).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Progress by Series</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border pt-4 space-y-4">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))
              : stats?.seriesProgress.map((sp) => (
                  <div key={sp.seriesId} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{sp.seriesTitle}</span>
                      <span className="text-muted-foreground">
                        {sp.completedLabs}/{sp.totalLabs} labs
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${sp.percentComplete}%` }}
                      />
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      )}

      {/* ── Continue learning quick start ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Continue Learning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 border-t border-border pt-4">
          <Link
            to="/series"
            className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors group"
          >
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Interactive Practice Series Catalog</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hands-on practice labs for SQL, TypeScript, Backend & Systems</p>
            </div>
            <span className="text-xs font-semibold text-primary">Browse Catalog</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center space-y-1">
        <Icon className="size-5 mx-auto text-primary" />
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
