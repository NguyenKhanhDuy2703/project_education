import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  feedbackAdminApi,
  type AdminFeedbackItem,
  type FeedbackCategory,
} from '@/features/admin/api/feedback.admin.api';
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
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { AdminToast } from './_components/AdminToast';
import {
  MessageSquareQuote,
  Bug,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Search,
  ExternalLink,
  Eye,
  RefreshCw,
  Calendar,
  Mail,
  User,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

function getCategoryBadge(cat: FeedbackCategory) {
  switch (cat) {
    case 'bug':
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] gap-1 font-semibold">
          <Bug className="size-3" />
          Bug Report
        </Badge>
      );
    case 'feature_request':
      return (
        <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px] gap-1 font-semibold">
          <Lightbulb className="size-3" />
          Feature Request
        </Badge>
      );
    case 'content_lab':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] gap-1 font-semibold">
          <BookOpen className="size-3" />
          Lab Content
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] gap-1 font-semibold">
          <HelpCircle className="size-3" />
          General / Other
        </Badge>
      );
  }
}

function parseFeedbackMessage(msg: string) {
  const match = msg.match(/^\[(?:Tính năng|Feature):\s*([^\]]+)\]\s*([\s\S]*)$/i);
  if (match) {
    return { feature: match[1].trim(), content: match[2].trim() };
  }
  return { feature: null, content: msg };
}

export function AdminFeedbackPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackItem | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<AdminFeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!feedbackToDelete) return;
    setIsDeleting(true);
    try {
      await feedbackAdminApi.delete(feedbackToDelete.id);
      setToastMessage({ text: 'Feedback deleted successfully', type: 'success' });
      setFeedbackToDelete(null);
      if (selectedFeedback?.id === feedbackToDelete.id) {
        setSelectedFeedback(null);
      }
      refetch();
    } catch (err: any) {
      setToastMessage({
        text: err?.response?.data?.message || 'Failed to delete feedback',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination state: 10 items/page
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: feedbackList = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-feedbacks-list'],
    queryFn: () => feedbackAdminApi.getAll(),
  });

  // Category counts
  const counts = useMemo(() => {
    return {
      all: feedbackList.length,
      bug: feedbackList.filter((f) => f.category === 'bug').length,
      feature_request: feedbackList.filter((f) => f.category === 'feature_request').length,
      content_lab: feedbackList.filter((f) => f.category === 'content_lab').length,
      other: feedbackList.filter((f) => f.category === 'other').length,
    };
  }, [feedbackList]);

  // Filtered list
  const filteredList = useMemo(() => {
    let list = feedbackList;

    if (activeCategory !== 'all') {
      list = list.filter((f) => f.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.message.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.user?.name.toLowerCase().includes(q) ||
          f.pageUrl?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [feedbackList, activeCategory, search]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquareQuote className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Feedback
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review user suggestions, bug reports, and practice lab feedback submitted from across the platform.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground">Total Feedbacks</p>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.all}</p>
        </Card>
        <Card className="p-4 border-border bg-card">
          <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
            <Bug className="size-3" /> Bug Reports
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.bug}</p>
        </Card>
        <Card className="p-4 border-border bg-card">
          <p className="text-[11px] font-medium text-violet-500 flex items-center gap-1">
            <Lightbulb className="size-3" /> Feature Requests
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.feature_request}</p>
        </Card>
        <Card className="p-4 border-border bg-card">
          <p className="text-[11px] font-medium text-blue-500 flex items-center gap-1">
            <BookOpen className="size-3" /> Lab Content
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.content_lab}</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
          <TabsList className="h-9 p-1 bg-muted/60 flex-wrap">
            <TabsTrigger value="all" className="text-xs px-3 font-semibold">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="bug" className="text-xs px-3 font-semibold">
              Bugs ({counts.bug})
            </TabsTrigger>
            <TabsTrigger value="feature_request" className="text-xs px-3 font-semibold">
              Features ({counts.feature_request})
            </TabsTrigger>
            <TabsTrigger value="content_lab" className="text-xs px-3 font-semibold">
              Labs ({counts.content_lab})
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs px-3 font-semibold">
              Other ({counts.other})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, message..."
            className="h-9 pl-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Feedback List / Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="size-5 animate-spin text-primary" />
            <span>Loading user feedbacks...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No feedbacks found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedList.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(item.category)}

                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <User className="size-3 text-muted-foreground" />
                      {item.user ? item.user.name : 'Guest User'}
                    </span>

                    {(item.email || item.user?.email) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Mail className="size-3" />
                        {item.user?.email || item.email}
                      </span>
                    )}

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto sm:ml-0">
                      <Calendar className="size-3" />
                      {new Date(item.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {(() => {
                    const { feature, content } = parseFeedbackMessage(item.message);
                    return (
                      <div className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg border border-border/50 space-y-1">
                        {feature && (
                          <div className="flex items-center gap-1.5 pb-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              Feature: {feature}
                            </span>
                          </div>
                        )}
                        <p className="line-clamp-2 leading-relaxed">{content}</p>
                      </div>
                    );
                  })()}

                  {item.pageUrl && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-foreground/70">Context URL:</span>
                      <a
                        href={item.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-0.5 truncate"
                      >
                        {item.pageUrl}
                        <ExternalLink className="size-2.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFeedback(item)}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>Inspect</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFeedbackToDelete(item)}
                    className="size-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    title="Delete feedback"
                    aria-label="Delete feedback"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shadcn Pagination */}
        {filteredList.length > 0 && (
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredList.length}
            itemName="feedbacks"
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <Dialog open={Boolean(selectedFeedback)} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                {getCategoryBadge(selectedFeedback.category)}
                <DialogTitle className="text-base font-bold text-foreground">
                  Feedback Details
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                <span>Received on: {new Date(selectedFeedback.createdAt).toUTCString()}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <span className="text-muted-foreground text-[11px] block font-semibold">Sender Information</span>
                <p className="text-foreground font-medium">
                  {selectedFeedback.user ? selectedFeedback.user.name : 'Guest User'}
                </p>
                <p className="text-muted-foreground font-mono text-[11px]">
                  {selectedFeedback.user?.email || selectedFeedback.email || 'No email provided'}
                </p>
              </div>

              {selectedFeedback.pageUrl && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[11px] block font-semibold">Reported Page URL</span>
                  <a
                    href={selectedFeedback.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-mono break-all"
                  >
                    {selectedFeedback.pageUrl}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-muted-foreground text-[11px] block font-semibold">Full Message</span>
                {(() => {
                  const { feature, content } = parseFeedbackMessage(selectedFeedback.message);
                  return (
                    <div className="p-3 bg-muted/60 border border-border rounded-lg text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto space-y-2">
                      {feature && (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                            Feature: {feature}
                          </span>
                        </div>
                      )}
                      <div>{content}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center justify-between gap-2 w-full pt-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  const target = selectedFeedback;
                  setSelectedFeedback(null);
                  setFeedbackToDelete(target);
                }}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Feedback</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedFeedback(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {feedbackToDelete && (
        <Dialog
          open={Boolean(feedbackToDelete)}
          onOpenChange={(open) => !open && !isDeleting && setFeedbackToDelete(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <span className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </span>
                <DialogTitle className="text-base font-bold text-foreground">
                  Delete Feedback
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground pt-2">
                Are you sure you want to permanently delete this feedback from{' '}
                <strong className="text-foreground">
                  {feedbackToDelete.user?.name || feedbackToDelete.email || 'Guest User'}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 bg-muted/40 rounded-lg text-xs text-foreground italic border border-border/50 line-clamp-3">
              "{feedbackToDelete.message}"
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFeedbackToDelete(null)}
                disabled={isDeleting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="text-xs gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast Notification */}
      <AdminToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
