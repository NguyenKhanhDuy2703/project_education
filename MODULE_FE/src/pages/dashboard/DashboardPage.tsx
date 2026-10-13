/**
 * DashboardPage (updated)
 *
 * Workflow ref: Docs/workflows/04-lab-submission-progress.md
 * Fetches /api/users/me/dashboard-stats via labApi.getDashboardStats()
 * and renders: completed count, streak, per-series progress bars.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import { labApi } from '@/features/lab/api/lab.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Phone,
  Mail,
  BookOpen,
  Flame,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: labApi.getDashboardStats,
  });

  const completionPct =
    stats && stats.totalLabs > 0
      ? Math.round((stats.totalCompleted / stats.totalLabs) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learner Profile &amp; Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hello, {user?.name || 'Learner'} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(user, 'CONTENT_TOPIC_CREATE') && (
            <Button size="sm" variant="outline" asChild className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary">
              <Link to="/contributor">
                <BookOpen className="size-3.5" />
                Contributor Studio
              </Link>
            </Button>
          )}
          {can(user, 'USER_MANAGE') && (
            <Button size="sm" asChild className="h-8 text-xs font-bold gap-1.5">
              <Link to="/admin">
                Admin Studio
              </Link>
            </Button>
          )}
          <Badge
            variant={user?.role === 'admin' ? 'destructive' : user?.role === 'userPro' ? 'default' : 'secondary'}
            className="uppercase text-xs font-bold"
          >
            {user?.role || 'user'}
          </Badge>
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Progress by Series
            </CardTitle>
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

      {/* ── Profile + Quick start ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="size-4 text-primary" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-border pt-4 text-sm">
            <Row icon={Phone} label="Phone" value={user?.phone} />
            <Row icon={Mail} label="Email" value={user?.email || 'Not provided'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 border-t border-border pt-4">
            <Link
              to="/series"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-7 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                  <BookOpen className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Lab Series Catalog</p>
                  <p className="text-[11px] text-muted-foreground">Bite-sized 15–30 min practice</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Link to="/series">
          <Button className="gap-2 font-semibold">
            <BookOpen className="size-4" /> Explore All Series <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center space-y-1">
        <Icon className="size-4 mx-auto text-primary" />
        <p className="text-xl font-extrabold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  );
}
