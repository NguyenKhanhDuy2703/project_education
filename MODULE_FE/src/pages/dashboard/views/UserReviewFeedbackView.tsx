import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/stores/store';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  title: string;
  type: 'series' | 'lab';
  status: string;
  version?: string;
  reviewFeedback?: string;
  updatedAt?: string;
}

export function UserReviewFeedbackView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch user's series
  const { data: serverSeries = [], isLoading: isLoadingSeries, refetch: refetchSeries } = useQuery({
    queryKey: ['contributor-my-series', user?.id],
    queryFn: () => seriesApi.getMySeries(),
  });

  // 2. Fetch user's labs
  const { data: serverLabs = [], isLoading: isLoadingLabs, refetch: refetchLabs } = useQuery({
    queryKey: ['contributor-my-labs', user?.id],
    queryFn: () => labApi.getMyLabs(),
  });

  const isLoading = isLoadingSeries || isLoadingLabs;

  // Filter items specifically requesting changes
  const revisionItems: FeedbackItem[] = [
    ...serverSeries
      .filter((s) => s.status === 'changes_requested')
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: 'series' as const,
        status: s.status || 'changes_requested',
        version: s.version || 'v1.0',
        reviewFeedback: s.reviewFeedback,
        updatedAt: s.updatedAt,
      })),
    ...serverLabs
      .filter((l) => l.status === 'changes_requested')
      .map((l) => ({
        id: l.id,
        title: l.title,
        type: 'lab' as const,
        status: l.status || 'changes_requested',
        version: l.version || 'v1.0',
        reviewFeedback: l.reviewFeedback,
        updatedAt: (l as any).updatedAt,
      })),
  ];

  // Resubmit mutation
  const handleResubmit = async (item: FeedbackItem) => {
    setResubmittingId(item.id);
    try {
      if (item.type === 'series') {
        await seriesApi.submitForReview(item.id);
        queryClient.invalidateQueries({ queryKey: ['contributor-my-series'] });
      } else {
        await labApi.submitForReview(item.id);
        queryClient.invalidateQueries({ queryKey: ['contributor-my-labs'] });
      }
      showToast(`Resubmitted "${item.title}" for review successfully!`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to resubmit. Please try again.', 'error');
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Action / Status Toolbar (No Redundant Page Heading) */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/60">
        <Badge
          variant="outline"
          className={`text-xs font-mono font-bold ${
            revisionItems.length > 0
              ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
              : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
          }`}
        >
          {revisionItems.length} {revisionItems.length === 1 ? 'item' : 'items'} requiring action
        </Badge>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchSeries();
            refetchLabs();
          }}
          disabled={isLoading}
          className="h-8 text-xs px-3 font-medium shrink-0"
        >
          {isLoading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {/* Revision List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Checking review statuses...
        </div>
      ) : revisionItems.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border bg-card/40 text-center space-y-3">
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-foreground">All Clear! No Revisions Requested</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              None of your authored modules are currently blocked by reviewer feedback. All your content submissions are either approved, in review, or saved as drafts.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/user/dashboard/content')}
              className="text-xs font-semibold px-4"
            >
              Go to My Content
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {revisionItems.map((item) => {
            const isResubmitting = resubmittingId === item.id;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="p-5 rounded-2xl border border-amber-500/30 bg-card hover:border-amber-500/50 transition-all shadow-xs space-y-4"
              >
                {/* Item Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold bg-muted/50 border-border"
                    >
                      {item.type === 'series' ? 'Curriculum Series' : 'Interactive Lab'}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="text-[11px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                    >
                      Changes Requested
                    </Badge>

                    {item.version && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {item.version}
                      </span>
                    )}
                  </div>

                  {item.updatedAt && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    {item.title}
                  </h3>
                </div>

                {/* Reviewer Note Box */}
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>Reviewer Notes &amp; Required Changes:</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-sans pl-5 whitespace-pre-wrap">
                    {item.reviewFeedback ||
                      'The reviewer has requested revisions before publication. Please review the instructions, sample data, and exercise tests, then resubmit.'}
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (item.type === 'lab') {
                        navigate(`/user/dashboard/labs/${item.id}/edit`);
                      } else {
                        navigate('/user/dashboard/content');
                      }
                    }}
                    className="h-8 text-xs font-semibold px-3"
                  >
                    {item.type === 'lab' ? 'Edit in Lab Studio' : 'Open in Content Studio'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleResubmit(item)}
                    disabled={isResubmitting}
                    className="h-8 text-xs font-bold px-3.5 bg-primary text-primary-foreground shadow-xs"
                  >
                    {isResubmitting ? 'Resubmitting...' : 'Mark Fixed & Resubmit'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
