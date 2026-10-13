import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/stores/store';
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
  Plus,
  Send,
  MessageSquareQuote,
  Search,
  Eye,
  Edit,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { ContentLifecycleStatus } from '@/types/lab.types';

export function ContributorContentPage({ defaultTab = 'all' }: { defaultTab?: 'all' | 'topics' | 'series' | 'labs' | 'feedback' | 'published' }) {
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || defaultTab);
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
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Author's Series from real API
  const { data: authorSeries = [], refetch: refetchSeries } = useQuery({
    queryKey: ['contributor-my-series', user?.id],
    queryFn: () => seriesApi.getMySeries(),
  });

  // 2. Author's Labs from real API
  const { data: authorLabs = [], refetch: refetchLabs } = useQuery({
    queryKey: ['contributor-my-labs', user?.id],
    queryFn: () => labApi.getMyLabs(),
  });

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
          description: `Sandbox: ${l.sandboxType} • ${l.estimatedMinutes} mins`,
          reviewFeedback: l.reviewFeedback,
          item: l,
        }))
      );
    }

    if (activeTab === 'feedback') {
      list = list.filter((i) => i.status === 'changes_requested');
    }

    if (activeTab === 'published') {
      list = list.filter((i) => i.status === 'published');
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
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manage Your Authored Content
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Displays topics, series, and labs authored by <strong>{user?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/contributor/create">
            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-xs">
              <Plus className="size-3.5" />
              Create New Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="h-9 pl-9 text-xs bg-card"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All ({authorSeries.length + authorLabs.length})</option>
            <option value="draft">Draft</option>
            <option value="submitted">Pending Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto pb-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 p-1 bg-muted/60 flex w-max min-w-full">
            <TabsTrigger value="all" className="text-xs px-3 font-medium">All</TabsTrigger>
            <TabsTrigger value="series" className="text-xs px-3 font-medium">Series ({authorSeries.length})</TabsTrigger>
            <TabsTrigger value="labs" className="text-xs px-3 font-medium">Labs ({authorLabs.length})</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs px-3 font-medium">
              Changes Requested
              {combinedList.filter(i => i.status === 'changes_requested').length > 0 && (
                <Badge variant="destructive" className="ml-1.5 size-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs px-3 font-medium">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {combinedList.length === 0 ? (
          <Card className="border-dashed border-border p-12 text-center space-y-3">
            <p className="text-xs text-muted-foreground">No matching content found.</p>
            <Link to="/contributor/create">
              <Button size="sm" variant="outline" className="text-xs">
                + Create new content
              </Button>
            </Link>
          </Card>
        ) : (
          combinedList.map((item) => {
            const isDraft = item.status === 'draft';
            const isChangesRequested = item.status === 'changes_requested';
            const isSubmitted = item.status === 'submitted';
            const isApproved = item.status === 'approved';

            return (
              <Card key={`${item.type}-${item.id}`} className="border-border bg-card hover:border-primary/30 transition-all p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-sans font-semibold tracking-wide uppercase h-4.5 px-1.5">
                        {item.type.toUpperCase()}
                      </Badge>
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

                  {/* Actions for Contributor: NO PUBLISH BUTTON */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {/* View Feedback if Changes Requested */}
                    {isChangesRequested && item.reviewFeedback && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewFeedback(item.title, item.reviewFeedback)}
                        className="h-8 text-xs font-semibold gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                      >
                        <MessageSquareQuote className="size-3.5" />
                        View Feedback
                      </Button>
                    )}

                    {/* Submit for Review (Draft or Changes Requested) */}
                    {(isDraft || isChangesRequested) && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenSubmit({ id: item.id, title: item.title, type: item.type })}
                        className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
                      >
                        <Send className="size-3" />
                        {isChangesRequested ? 'Resubmit' : 'Submit for Review'}
                      </Button>
                    )}

                    {/* Preview as Student */}
                    {item.type === 'lab' && (
                      <Link to={`/labs/${item.id}`} target="_blank">
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="size-3.5" />
                          Preview
                        </Button>
                      </Link>
                    )}

                    {/* Edit Lab */}
                    {item.type === 'lab' && (
                      <Link to={`/admin/labs/${item.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          <Edit className="size-3" />
                          Edit
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
                        Approved (Waiting for Admin to Publish)
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Submit for Review Modal ─────────────────────────────────────── */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Send className="size-4 text-primary" />
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
            <Button variant="outline" size="sm" onClick={() => setSubmitModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="text-xs font-bold gap-1.5"
            >
              <Send className="size-3" />
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
            <Button size="sm" onClick={() => setFeedbackDialogOpen(false)} className="text-xs font-semibold">
              Understood, start revisions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
