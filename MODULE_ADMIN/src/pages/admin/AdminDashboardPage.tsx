import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Layers,
  Code2,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
import { entitlementsAdminApi } from '@/features/admin/api/entitlements.admin.api';
import { seriesApi } from '@/features/lab/api/series.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDashboardPage() {
  // 1. Fetch Users Count
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: () => usersAdminApi.getUsers({ page: 1, limit: 1 }),
  });

  // 2. Fetch Plans & Subscription Info
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['admin-stats-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
  });

  // 3. Fetch Series & Labs
  const { data: seriesList = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ['admin-stats-series'],
    queryFn: () => seriesApi.getAll(true),
  });

  // 4. Fetch Recent Audit Logs
  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['admin-stats-audit'],
    queryFn: () => entitlementsAdminApi.getAuditLogs({ page: 1, limit: 6 }),
  });

  // Calculate Aggregates
  const totalUsers = usersData?.meta?.total ?? 0;
  const totalSeries = seriesList.length;
  const totalLabs = seriesList.reduce((acc, s) => acc + (s._count?.labs ?? s.labs?.length ?? 0), 0);
  const proSeriesCount = seriesList.filter((s) => s.isProOnly).length;
  const totalAuditActions = auditData?.meta?.total ?? 0;

  // Calculate Subscriptions count across plans
  const totalSubscriptions = plans.reduce((acc, p) => acc + (p._count?.subscriptions ?? 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
              Live Operations
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Real-time Platform Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Platform Management Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor users, entitlement tiers, practice labs, and administrative security events.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/content">
            <Button size="sm" className="gap-1.5 shadow-sm font-semibold">
              <Layers className="size-4" /> Manage Content
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button size="sm" variant="outline" className="gap-1.5 font-semibold">
              <Users className="size-4" /> User Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Learners & Staff
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoadingUsers ? '...' : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span>Registered accounts on database</span>
            </p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Plans
            </CardTitle>
            <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoadingPlans ? '...' : plans.length} Tiers
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSubscriptions} active user subscriptions
            </p>
          </CardContent>
        </Card>

        {/* Topics & Labs */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Practice Labs & Topics
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Code2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoadingSeries ? '...' : `${totalSeries} / ${totalLabs}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              <span>{proSeriesCount} Pro-exclusive topics</span>
            </p>
          </CardContent>
        </Card>

        {/* Security Audit Entries */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Audit Events
            </CardTitle>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <ShieldAlert className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoadingAudit ? '...' : totalAuditActions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Immutable ledger operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2-Column Section: Plans Breakdown + Recent Security Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Subscription Tiers & Feature Matrix Overview */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Subscription Tiers</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Platform capability bundles configured in database
                  </CardDescription>
                </div>
                <Link to="/admin/plans">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                    Manage <ArrowUpRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {isLoadingPlans ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Loading plan breakdown...
                </div>
              ) : (
                plans.map((p) => {
                  const subscriberCount = p._count?.subscriptions ?? 0;
                  const ratio = totalSubscriptions > 0 ? (subscriberCount / totalSubscriptions) * 100 : 0;

                  return (
                    <div key={p.id} className="p-3 rounded-xl border border-border bg-card/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{p.name}</span>
                          {p.isDefault && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-primary">
                          {p.price > 0 ? `${Number(p.price).toLocaleString()} VND` : 'Free'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{p.planFeatures?.length || 0} features attached</span>
                        <span>{subscriberCount} subscribers</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.max(ratio, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 rounded-b-xl flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Need to add custom entitlements?</span>
            <Link to="/admin/plans">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Edit Matrix
              </Button>
            </Link>
          </div>
        </Card>

        {/* Right Column (7 cols): Recent Security & Audit Feed */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Audit Activity</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Real-time ledger of administrative decisions & feature overrides
                </CardDescription>
              </div>
              <Link to="/admin/audit">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                  View Full Trail <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {isLoadingAudit ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading audit trail...
              </div>
            ) : (auditData?.items?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recent administrative actions recorded.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {auditData?.items.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {log.actor.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          performed
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-mono ${
                            log.action === 'FEATURE_OVERRIDE_DENY'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : log.action === 'FEATURE_OVERRIDE_ALLOW'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {log.action}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>Target:</span>
                        <span className="font-medium text-foreground">
                          {log.targetUser ? log.targetUser.name : 'System'}
                        </span>
                        {log.details?.reason && (
                          <span className="italic truncate max-w-xs">
                            — "{log.details.reason}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground shrink-0 sm:text-right">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Shortcuts Navigation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <Users className="size-4" /> User Management
            </h3>
            <p className="text-xs text-muted-foreground">
              Elevate roles, suspend accounts, and override features.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to="/admin/plans"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <CreditCard className="size-4" /> Plans &amp; Feature Flags
            </h3>
            <p className="text-xs text-muted-foreground">
              Define subscription tiers and map feature entitlements.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to="/admin/content"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <Layers className="size-4" /> Curriculum &amp; Labs
            </h3>
            <p className="text-xs text-muted-foreground">
              Create and publish practice challenges and series.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
