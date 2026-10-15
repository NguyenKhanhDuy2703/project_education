import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import type { UserLabSubmissionItem } from '@/types/lab.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ArrowUpDown,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export function UserLabSubmissionsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name-asc' | 'name-desc'>('latest');

  const { data: submissions = [], isLoading } = useQuery<UserLabSubmissionItem[]>({
    queryKey: ['user-all-submissions'],
    queryFn: labApi.getUserSubmissions,
  });

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((s) => {
        const labTitle = s.lab?.title?.toLowerCase() || '';
        const seriesTitle = s.lab?.series?.title?.toLowerCase() || '';
        return labTitle.includes(q) || seriesTitle.includes(q);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Sort by criteria
    list.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name-asc') {
        const nameA = a.lab?.title || '';
        const nameB = b.lab?.title || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name-desc') {
        const nameA = a.lab?.title || '';
        const nameB = b.lab?.title || '';
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return list;
  }, [submissions, searchTerm, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed = submissions.filter((s) => s.status === 'passed').length;
    const failed = submissions.filter((s) => s.status === 'failed').length;
    const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, rate };
  }, [submissions]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Summary KPI Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Submissions
          </span>
          <div className="text-2xl font-black text-foreground mt-1">
            {isLoading ? '…' : stats.total}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Passed Attempts
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {isLoading ? '…' : stats.passed}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Failed Attempts
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {isLoading ? '…' : stats.failed}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pass Rate
          </span>
          <div className="text-2xl font-black text-primary mt-1">
            {isLoading ? '…' : `${stats.rate}%`}
          </div>
        </div>
      </div>

      {/* ── Controls & Filter Bar (Single cohesive toolbar) ─────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search submission by lab or series name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('passed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'passed'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Passed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'failed'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Failed
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground font-medium outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="latest">Last Submission (Newest)</option>
              <option value="oldest">Last Submission (Oldest)</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Submissions Table ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Terminal className="size-6" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-semibold text-foreground">
                {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {submissions.length === 0
                  ? 'Complete interactive coding tasks in the practice labs to see your execution logs, test outputs, and evaluations here.'
                  : 'Try adjusting your search terms or clearing the status filter.'}
              </p>
            </div>
            {submissions.length === 0 && (
              <Button size="sm" asChild className="text-xs font-semibold px-4">
                <Link to="/series">
                  Explore Practice Labs
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Lab / Practice Exercise</th>
                  <th className="py-3 px-4">Series Track</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Execution Time</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredSubmissions.map((sub) => {
                  const labSlug = sub.lab?.slug || sub.labId;
                  const isPassed = sub.status === 'passed';
                  const dateStr = new Date(sub.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Lab Name */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <Link
                          to={`/labs/${labSlug}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{sub.lab?.title || `Lab ${sub.labId.substring(0, 8)}`}</span>
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </Link>
                        {sub.lab?.sandboxType && (
                          <span className="text-[10px] text-muted-foreground font-mono uppercase block mt-0.5">
                            {sub.lab.sandboxType.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Series */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {sub.lab?.series ? (
                          <Link
                            to={`/series/${sub.lab.series.slug}`}
                            className="hover:text-foreground transition-colors inline-block truncate max-w-[200px]"
                          >
                            {sub.lab.series.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/60 italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPassed ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-[11px] px-2 py-0.5"
                          >
                            PASSED
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold text-[11px] px-2 py-0.5"
                          >
                            FAILED
                          </Badge>
                        )}
                      </td>

                      {/* Execution Time */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {sub.executionTimeMs ?? 0}ms
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Link to={`/labs/${labSlug}`}>
                            Open Lab
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
