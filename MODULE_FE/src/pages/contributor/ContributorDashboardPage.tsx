import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { openCreateDialog } from '@/stores/slices/contributor.slice';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/domain/StatusBadge';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Layers,
  FolderTree,
  Folder,
  Code2,
} from 'lucide-react';

export function ContributorDashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Filter content by current author from real API
  const { data: authorSeries = [] } = useQuery({
    queryKey: ['contributor-dashboard-series', user?.id],
    queryFn: () => seriesApi.getMySeries(),
  });

  const { data: authorLabs = [] } = useQuery({
    queryKey: ['contributor-dashboard-labs', user?.id],
    queryFn: () => labApi.getMyLabs(),
  });

  const stats = useMemo(() => {
    const allItems = [...authorSeries, ...authorLabs];
    return {
      total: allItems.length,
      drafts: allItems.filter((i) => i.status === 'draft').length,
      submitted: allItems.filter((i) => i.status === 'submitted').length,
      changesRequested: allItems.filter((i) => i.status === 'changes_requested').length,
      published: allItems.filter((i) => i.status === 'published').length,
    };
  }, [authorSeries, authorLabs]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Overview of your authored series, interactive labs, and review feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => dispatch(openCreateDialog())}
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <PlusCircle className="size-3.5" />
            <span>Create Content</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="size-3.5 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {stats.submitted}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Submitted for Admin audit
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Changes Requested</span>
              <AlertTriangle className="size-3.5 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              {stats.changesRequested}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Revisions requested by Admin
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Published Live</span>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {stats.published}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Active in public catalog
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Drafts</span>
              <FileText className="size-3.5 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {stats.drafts}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            In progress, unsubmitted
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/contributor/topics" className="group">
          <Card className="border-border bg-card group-hover:border-primary/50 group-hover:shadow-xs transition-all p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <FolderTree className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  Topics
                </h3>
                <p className="text-[11px] text-muted-foreground">Subject categories and domains</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </Card>
        </Link>

        <Link to="/contributor/series" className="group">
          <Card className="border-border bg-card group-hover:border-primary/50 group-hover:shadow-xs transition-all p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  Series
                </h3>
                <p className="text-[11px] text-muted-foreground">{authorSeries.length} series authored</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </Card>
        </Link>

        <Link to="/contributor/labs" className="group">
          <Card className="border-border bg-card group-hover:border-primary/50 group-hover:shadow-xs transition-all p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Code2 className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  My Labs
                </h3>
                <p className="text-[11px] text-muted-foreground">{authorLabs.length} labs authored</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </Card>
        </Link>
      </div>

      {/* Recent Author Content Table */}
      <Card className="border-border bg-card">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Recent Authored Content
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              List of lessons and labs created by your account
            </CardDescription>
          </div>
          <Link to="/contributor/labs">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {authorSeries.length === 0 && authorLabs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <p>You have not authored any content yet.</p>
                <Button
                  onClick={() => dispatch(openCreateDialog())}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Create your first content
                </Button>
              </div>
            ) : (
              authorSeries.slice(0, 5).map((s) => (
                <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary shrink-0">
                      <Folder className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{s.title}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase font-sans font-semibold">
                          Series
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={s.status || 'draft'} size="sm" />
                    <Link to={`/contributor/series`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
