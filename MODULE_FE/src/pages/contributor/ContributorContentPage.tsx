import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { openCreateDialog, setMySeries } from '@/stores/slices/contributor.slice';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/domain/StatusBadge';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import type { ContentLifecycleStatus, LabSeries } from '@/types/lab.types';
import { getSystemTopicTags, type TopicTag } from '@/services/topicTags.service';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export function ContributorContentPage({
  defaultTab = 'series',
}: {
  defaultTab?: 'all' | 'series' | 'labs' | 'feedback' | 'published';
}) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const reduxSeries = useAppSelector((state) => state.contributor.mySeries);

  const [systemTopicTags, setSystemTopicTags] = useState<TopicTag[]>(() => getSystemTopicTags());

  useEffect(() => {
    const handleUpdate = () => setSystemTopicTags(getSystemTopicTags());
    window.addEventListener('studyweb:topic-tags-updated', handleUpdate);
    return () => window.removeEventListener('studyweb:topic-tags-updated', handleUpdate);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Submit Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingItem, setSubmittingItem] = useState<{ id: string; title: string; type: 'series' | 'lab' } | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback Dialog state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState<{ title: string; feedback: string } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Author's Series from real API
  const { data: serverSeries = [], refetch: refetchSeries } = useQuery({
    queryKey: ['contributor-my-series', user?.id],
    queryFn: () => seriesApi.getMySeries(),
  });

  // Keep redux in sync when server returns without infinite dispatch loop
  useEffect(() => {
    if (serverSeries && serverSeries.length > 0) {
      const seen = new Set<string>();
      const dedupedServer = serverSeries.filter((s) => {
        if (!s.id || seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      const hasOptimistic = reduxSeries.some((s) => s.id?.startsWith('temp-'));
      if (!hasOptimistic) {
        const isIdentical =
          reduxSeries.length === dedupedServer.length &&
          reduxSeries.every((item, idx) => item.id === dedupedServer[idx]?.id && item.updatedAt === dedupedServer[idx]?.updatedAt);
        if (!isIdentical) {
          dispatch(setMySeries(dedupedServer));
        }
      }
    }
  }, [serverSeries, reduxSeries, dispatch]);

  // Combined author series with strict deduplication by ID and Slug
  const authorSeries: LabSeries[] = useMemo(() => {
    const source = reduxSeries.length > 0 ? reduxSeries : serverSeries;
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    return source.filter((item) => {
      if (item.id && seenIds.has(item.id)) return false;
      if (item.slug && seenSlugs.has(item.slug)) return false;
      if (item.id) seenIds.add(item.id);
      if (item.slug) seenSlugs.add(item.slug);
      return true;
    });
  }, [reduxSeries, serverSeries]);

  // 2. Author's Labs from real API
  const { data: authorLabs = [], refetch: refetchLabs } = useQuery({
    queryKey: ['contributor-my-labs', user?.id],
    queryFn: () => labApi.getMyLabs(),
  });

  // Update URL param when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      prev.set('tab', tab);
      return prev;
    });
  };

  // Combined list for display
  const combinedList = useMemo(() => {
    let list: Array<{
      id: string;
      title: string;
      type: 'series' | 'lab';
      status: ContentLifecycleStatus;
      version?: string;
      description?: string;
      reviewFeedback?: string;
      item: any;
    }> = [];

    if (activeTab === 'all' || activeTab === 'series') {
      list.push(
        ...authorSeries.map((s) => ({
          id: s.id,
          title: s.title,
          type: 'series' as const,
          status: s.status || 'draft',
          version: s.version || 'v1.0',
          description: s.description,
          reviewFeedback: s.reviewFeedback,
          item: s,
        }))
      );
    }

    if (activeTab === 'all' || activeTab === 'labs') {
      list.push(
        ...authorLabs.map((l) => ({
          id: l.id,
          title: l.title,
          type: 'lab' as const,
          status: l.status || 'draft',
          version: l.version || 'v1.0',
          description: `Format: ${l.sandboxType || 'interactive'} • ${l.estimatedMinutes || 20} mins`,
          reviewFeedback: l.reviewFeedback,
          item: l,
        }))
      );
    }

    if (activeTab === 'feedback') {
      list = [
        ...authorSeries.filter((s) => s.status === 'changes_requested').map((s) => ({
          id: s.id,
          title: s.title,
          type: 'series' as const,
          status: s.status!,
          version: s.version || 'v1.0',
          description: s.description,
          reviewFeedback: s.reviewFeedback,
          item: s,
        })),
        ...authorLabs.filter((l) => l.status === 'changes_requested').map((l) => ({
          id: l.id,
          title: l.title,
          type: 'lab' as const,
          status: l.status!,
          version: l.version || 'v1.0',
          description: `Format: ${l.sandboxType || 'interactive'}`,
          reviewFeedback: l.reviewFeedback,
          item: l,
        })),
      ];
    }

    if (activeTab === 'published') {
      list = [
        ...authorSeries.filter((s) => s.status === 'published').map((s) => ({
          id: s.id,
          title: s.title,
          type: 'series' as const,
          status: s.status!,
          description: s.description,
          item: s,
        })),
        ...authorLabs.filter((l) => l.status === 'published').map((l) => ({
          id: l.id,
          title: l.title,
          type: 'lab' as const,
          status: l.status!,
          description: `Format: ${l.sandboxType}`,
          item: l,
        })),
      ];
    }

    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }

    return list;
  }, [authorSeries, authorLabs, activeTab, statusFilter, searchTerm]);

  // Pagination: 10 items per page
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(combinedList.length / pageSize) || 1;

  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, searchTerm]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return combinedList.slice(start, start + pageSize);
  }, [combinedList, page, pageSize]);

  // Handler: Open Submit Dialog
  const handleOpenSubmit = (item: { id: string; title: string; type: 'series' | 'lab' }) => {
    setSubmittingItem(item);
    setSubmitNotes('');
    setSubmitModalOpen(true);
  };

  // Handler: Confirm Submit for Review
  const handleConfirmSubmit = async () => {
    if (!submittingItem) return;
    setIsSubmitting(true);
    try {
      if (submittingItem.type === 'series') {
        await seriesApi.submitForReview(submittingItem.id);
      } else {
        await labApi.submitForReview(submittingItem.id);
      }
      await refetchSeries();
      await refetchLabs();
      showToast(`Submitted "${submittingItem.title}" for Admin review successfully!`);
    } catch {
      showToast('Failed to submit for review.');
    } finally {
      setIsSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  // Handler: View Feedback
  const handleViewFeedback = (title: string, feedback?: string) => {
    setViewingFeedback({
      title,
      feedback: feedback || 'No detailed feedback provided. Please review quality standards and resubmit.',
    });
    setFeedbackDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unified Search, Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content by title, topic, or description..."
              className="h-9 pl-9 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Pending Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>

          <Button
            onClick={() => dispatch(openCreateDialog())}
            size="sm"
            className="h-9 text-xs font-semibold shadow-xs px-3.5"
          >
            Create New Content
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full overflow-x-auto pb-1">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-9 p-1 bg-muted/60 flex w-max min-w-full">
            <TabsTrigger value="series" className="text-xs px-3 font-medium">
              Series ({authorSeries.length})
            </TabsTrigger>
            <TabsTrigger value="labs" className="text-xs px-3 font-medium">
              My Labs ({authorLabs.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-3 font-medium">
              All ({authorSeries.length + authorLabs.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs px-3 font-medium">
              Changes Requested
              {combinedList.filter((i) => i.status === 'changes_requested').length > 0 && (
                <Badge variant="destructive" className="ml-1.5 size-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs px-3 font-medium">
              Published
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── CONTENT LIST: SERIES, LABS, ALL, FEEDBACK, PUBLISHED ───────────── */}
      <div className="space-y-3">
        {combinedList.length === 0 ? (
            <Card className="border-dashed border-border p-12 text-center space-y-3">
              <p className="text-xs text-muted-foreground">No matching content found for this view.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(openCreateDialog())}
                className="text-xs"
              >
                + Create new content
              </Button>
            </Card>
          ) : (
            paginatedList.map((item) => {
              const isDraft = item.status === 'draft';
              const isChangesRequested = item.status === 'changes_requested';
              const isSubmitted = item.status === 'submitted';
              const isApproved = item.status === 'approved';

              const topicKey =
                item.type === 'series'
                  ? item.item.category
                  : authorSeries.find((s) => s.id === item.item.seriesId)?.category;
              const matchedTag = systemTopicTags.find((t) => t.key === topicKey);

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="border-border bg-card hover:border-primary/30 transition-all p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-sans font-semibold tracking-wide uppercase h-4.5 px-1.5"
                        >
                          {item.type.toUpperCase()}
                        </Badge>
                        {matchedTag && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-sans font-bold uppercase h-4.5 px-2 flex items-center gap-1 ${matchedTag.tagColor}`}
                          >
                            <Tag className="size-2.5" />
                            <span>{matchedTag.title}</span>
                          </Badge>
                        )}
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {item.title}
                        </h3>
                        <StatusBadge status={item.status} size="sm" />
                        {item.version && (
                          <span className="text-[10px] text-muted-foreground font-sans font-medium">
                            {item.version}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions for Contributor */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      {/* Add Lab to this Series */}
                      {item.type === 'series' && (
                        <Link to={`/user/dashboard/labs/new?seriesId=${item.id}`}>
                          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold px-2.5 border-primary/30 text-primary hover:bg-primary/10">
                            Add Lab
                          </Button>
                        </Link>
                      )}

                      {/* View Feedback if Changes Requested */}
                      {isChangesRequested && item.reviewFeedback && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewFeedback(item.title, item.reviewFeedback)}
                          className="h-8 text-xs font-semibold px-2.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                        >
                          View Feedback
                        </Button>
                      )}

                      {/* Submit for Review (Draft or Changes Requested) */}
                      {(isDraft || isChangesRequested) && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleOpenSubmit({
                              id: item.id,
                              title: item.title,
                              type: item.type,
                            })
                          }
                          className="h-8 text-xs font-bold px-3 bg-primary text-primary-foreground shadow-xs"
                        >
                          {isChangesRequested ? 'Resubmit' : 'Submit for Review'}
                        </Button>
                      )}

                      {/* Preview as Student */}
                      {item.type === 'lab' && (
                        <Link to={`/labs/${item.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            Preview
                          </Button>
                        </Link>
                      )}

                      {/* Edit Lab in Contributor Lab Studio */}
                      {item.type === 'lab' && (
                        <Link to={`/user/dashboard/labs/${item.id}/edit`}>
                          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold px-2.5">
                            Edit Lab
                          </Button>
                        </Link>
                      )}

                      {/* Waiting note when submitted */}
                      {isSubmitted && (
                        <span className="text-[11px] text-muted-foreground italic px-2">
                          Pending Admin review...
                        </span>
                      )}

                      {/* Approved note */}
                      {isApproved && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2">
                          Approved (Ready for publishing)
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}

          {/* Pagination */}
          {combinedList.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden mt-4">
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={combinedList.length}
                itemName="items"
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

      {/* ── Submit for Review Modal ─────────────────────────────────────── */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Submit Content for Admin Review
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Item <strong>"{submittingItem?.title}"</strong> will transition to <code>Submitted for review</code>. Admin will verify instructions, sandbox configuration, and solution test scripts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-foreground">
              Notes for Reviewer (Optional):
            </label>
            <Textarea
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              placeholder="e.g. Updated edge test cases for empty strings and refined explanation..."
              className="text-xs min-h-[90px] bg-card"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="text-xs font-bold px-4"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Feedback Dialog ────────────────────────────────────────── */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              <DialogTitle className="text-base">Feedback from Administrator</DialogTitle>
            </div>
            <DialogDescription className="text-xs font-semibold text-foreground">
              Lesson: {viewingFeedback?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-mono">
            {viewingFeedback?.feedback}
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setFeedbackDialogOpen(false)}
              className="text-xs font-semibold"
            >
              Understood, start revisions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
