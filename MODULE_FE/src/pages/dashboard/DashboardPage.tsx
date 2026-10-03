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
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trang cá nhân</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xin chào, {user?.name || 'Học viên'} 👋
          </p>
        </div>
        <Badge
          variant={user?.role === 'admin' ? 'destructive' : user?.role === 'userPro' ? 'default' : 'secondary'}
          className="uppercase text-xs font-bold"
        >
          {user?.role || 'user'}
        </Badge>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Bài hoàn thành"
          value={isLoading ? '…' : String(stats?.totalCompleted ?? 0)}
        />
        <StatCard
          icon={Layers}
          label="Tổng bài lab"
          value={isLoading ? '…' : String(stats?.totalLabs ?? 0)}
        />
        <StatCard
          icon={Flame}
          label="Chuỗi ngày học"
          value={isLoading ? '…' : `${stats?.streakDays ?? 0} ngày`}
        />
        <StatCard
          icon={BookOpen}
          label="Tiến độ chung"
          value={isLoading ? '…' : `${completionPct}%`}
        />
      </div>

      {/* ── Series progress ──────────────────────────────────────────────── */}
      {(isLoading || (stats?.seriesProgress ?? []).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Tiến độ theo Series
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
                        {sp.completedLabs}/{sp.totalLabs} bài
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
              <User className="size-4 text-primary" /> Tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-border pt-4 text-sm">
            <Row icon={Phone} label="SĐT" value={user?.phone} />
            <Row icon={Mail} label="Email" value={user?.email || 'Chưa cung cấp'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bắt đầu học</CardTitle>
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
                  <p className="text-xs font-semibold text-foreground">Series Bài Lab</p>
                  <p className="text-[11px] text-muted-foreground">Thực hành ngắn 15–30 phút</p>
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
            <BookOpen className="size-4" /> Khám phá series <ArrowRight className="size-4" />
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
