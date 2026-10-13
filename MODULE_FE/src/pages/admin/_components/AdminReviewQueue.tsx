import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminReviewApi, type ReviewQueueItem } from '@/features/admin/api/review.admin.api';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
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
import { renderMarkdown } from '../_utils/renderMarkdown';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Archive,
  Eye,
  UserCheck,
  Search,
} from 'lucide-react';

export function AdminReviewQueue() {
  const [activeQueueTab, setActiveQueueTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Detail Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);

  // Preview Mode in Modal: 'spec' | 'student_preview'
  const [previewMode, setPreviewMode] = useState<'spec' | 'student'>('spec');

  // Action Dialogs
  const [actionType, setActionType] = useState<'request_changes' | 'reject' | 'transfer' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newAuthorId, setNewAuthorId] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real review queue from backend API
  const { data: queueData, refetch } = useQuery({
    queryKey: ['admin-review-queue'],
    queryFn: () => adminReviewApi.getQueue(),
  });
  const combinedItems = queueData?.items || [];
  const queueCounts = queueData?.counts || {};

  // Fetch real users from backend API for author transfer
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-for-transfer'],
    queryFn: () => usersAdminApi.getUsers({ limit: 100 }),
  });
  const allUsers = usersData?.items || [];

  // Filter items by active review tab
  const filteredItems = useMemo(() => {
    let result = combinedItems;

    switch (activeQueueTab) {
      case 'pending':
        result = result.filter((i) => i.status === 'submitted');
        break;
      case 'changes_requested':
        result = result.filter((i) => i.status === 'changes_requested');
        break;
      case 'approved':
        result = result.filter((i) => i.status === 'approved');
        break;
      case 'published':
        result = result.filter((i) => i.status === 'published');
        break;
      case 'archived':
        result = result.filter((i) => i.status === 'archived');
        break;
      default:
        break;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.authorName?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [combinedItems, activeQueueTab, searchTerm]);

  // Handlers for Review Actions
  const handleOpenReview = (item: typeof selectedItem) => {
    setSelectedItem(item);
    setPreviewMode('spec');
    setReviewModalOpen(true);
  };

  const handleApprove = async (id: string, type: 'series' | 'lab') => {
    try {
      await adminReviewApi.approve(type, id);
      await refetch();
      setReviewModalOpen(false);
      showToast('Successfully approved! Content is ready to publish.');
    } catch {
      showToast('Failed to approve content.');
    }
  };

  const handlePublish = async (id: string, type: 'series' | 'lab') => {
    try {
      await adminReviewApi.publish(type, id);
      await refetch();
      setReviewModalOpen(false);
      showToast('Published live to student catalog!');
    } catch {
      showToast('Failed to publish content.');
    }
  };

  const handleUnpublish = async (id: string, type: 'series' | 'lab') => {
    try {
      await adminReviewApi.unpublish(type, id);
      await refetch();
      setReviewModalOpen(false);
      showToast('Unpublished and returned to approved status.');
    } catch {
      showToast('Failed to unpublish content.');
    }
  };

  const handleArchive = async (id: string, type: 'series' | 'lab') => {
    try {
      await adminReviewApi.archive(type, id);
      await refetch();
      setReviewModalOpen(false);
      showToast('Moved content to archive.');
    } catch {
      showToast('Failed to archive content.');
    }
  };

  const handleConfirmActionDialog = async () => {
    if (!selectedItem || !actionType) return;

    try {
      if (actionType === 'request_changes') {
        const fb = commentText.trim() || 'Please provide additional documentation and test cases.';
        await adminReviewApi.requestChanges(selectedItem.type, selectedItem.id, fb);
        showToast(`Change request sent to ${selectedItem.authorName}.`);
      } else if (actionType === 'reject') {
        const fb = commentText.trim() || 'Submission does not meet quality standards.';
        await adminReviewApi.reject(selectedItem.type, selectedItem.id, fb);
        showToast('Submission rejected.');
      } else if (actionType === 'transfer') {
        if (newAuthorId) {
          await adminReviewApi.transferOwnership(selectedItem.type, selectedItem.id, newAuthorId);
          showToast('Transferred ownership successfully.');
        }
      }
      await refetch();
    } catch {
      showToast('Action failed. Please try again.');
    }

    setActionType(null);
    setCommentText('');
    setReviewModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Content Review Queue
            <Badge variant="outline" className="font-mono text-xs font-normal">
              Review Queue
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit contributor submissions, request revisions, approve, and publish content live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title or author..."
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
        </div>
      </div>

      {/* 5 Tabs Review Queue */}
      <div className="w-full overflow-x-auto pb-1">
        <Tabs value={activeQueueTab} onValueChange={setActiveQueueTab}>
          <TabsList className="h-9 p-1 bg-muted/60 flex w-max min-w-full">
            <TabsTrigger value="pending" className="text-xs px-3 font-medium">
              Pending Review ({queueCounts.submitted ?? combinedItems.filter((i) => i.status === 'submitted').length})
            </TabsTrigger>
            <TabsTrigger value="changes_requested" className="text-xs px-3 font-medium">
              Changes Requested ({queueCounts.changes_requested ?? combinedItems.filter((i) => i.status === 'changes_requested').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs px-3 font-medium">
              Approved ({queueCounts.approved ?? combinedItems.filter((i) => i.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs px-3 font-medium">
              Published Live ({queueCounts.published ?? combinedItems.filter((i) => i.status === 'published').length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-3 font-medium">
              Archived ({queueCounts.archived ?? combinedItems.filter((i) => i.status === 'archived').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            No content items found in this category.
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="border-border bg-card hover:border-primary/40 transition-all p-4">
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
                    <span className="text-[11px] text-muted-foreground font-sans font-medium">
                      {item.version}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Author: <strong className="text-foreground">{item.authorName}</strong>
                    {item.description && ` • ${item.description}`}
                  </p>

                  {item.reviewFeedback && item.status === 'changes_requested' && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded w-fit mt-1">
                      Feedback: {item.reviewFeedback}
                    </p>
                  )}
                </div>

                {/* Action Buttons for Admin */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReview(item)}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    Review &amp; Inspect
                  </Button>

                  {/* Direct Publish button if Approved */}
                  {item.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublish(item.id, item.type)}
                      className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
                    >
                      <Globe className="size-3" />
                      Publish Now
                    </Button>
                  )}

                  {/* Unpublish if currently Published */}
                  {item.status === 'published' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnpublish(item.id, item.type)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Unpublish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── Review Detail Modal ────────────────────────────────────────── */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b border-border pb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Badge variant="outline" className="text-[10px] font-sans font-semibold tracking-wide uppercase h-5 px-2 shrink-0">
                  {selectedItem?.type.toUpperCase()}
                </Badge>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  {selectedItem?.title}
                </DialogTitle>
                {selectedItem && <StatusBadge status={selectedItem.status} size="sm" />}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0 self-start sm:self-auto">
                <Button
                  size="sm"
                  variant={previewMode === 'spec' ? 'secondary' : 'ghost'}
                  onClick={() => setPreviewMode('spec')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Technical Specifications
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'student' ? 'secondary' : 'ghost'}
                  onClick={() => setPreviewMode('student')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Student Simulation
                </Button>
              </div>
            </div>

            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 pt-1">
              <span>Contributor Author: <strong>{selectedItem?.authorName}</strong></span>
              <span>•</span>
              <span>Version: <strong className="font-semibold">{selectedItem?.version || 'v1.0'}</strong></span>
            </DialogDescription>
          </DialogHeader>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {previewMode === 'spec' ? (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Instructions &amp; Guidelines (Markdown):
                  </h4>
                  <div className="p-4 rounded-xl border border-border bg-card prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed max-h-56 overflow-y-auto">
                    {selectedItem?.instructions ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedItem.instructions) }} />
                    ) : (
                      <p className="text-muted-foreground italic">Description: {selectedItem?.description || 'No instructions provided'}</p>
                    )}
                  </div>
                </div>

                {/* Starter Code Snippet & Solution */}
                {selectedItem?.type === 'lab' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Starter Snippet:
                      </h4>
                      <pre className="p-3 rounded-lg border border-border bg-muted/30 font-mono text-xs overflow-x-auto max-h-44">
                        {selectedItem.initialSnippet || '// Starter code snippet...'}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Model Solution:
                      </h4>
                      <pre className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 font-mono text-xs overflow-x-auto max-h-44">
                        {selectedItem.solution || '// Reference solution from author'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Test Script */}
                {selectedItem?.testScript && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Worker Test Script (Automated Evaluation):
                    </h4>
                    <pre className="p-3 rounded-lg border border-border bg-muted/40 font-mono text-xs overflow-x-auto max-h-36">
                      {selectedItem.testScript}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Student Preview Simulation */
              <div className="rounded-xl border border-border p-5 bg-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                  <span className="font-semibold text-foreground">Student View Simulation:</span>
                  <Badge variant="outline" className="text-[10px]">Student Simulation</Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">{selectedItem?.title}</h3>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(selectedItem?.instructions || selectedItem?.description || ''),
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Action Bar */}
          <DialogFooter className="border-t border-border pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType('transfer')}
                className="h-8 text-xs gap-1.5"
              >
                <UserCheck className="size-3.5" />
                Transfer Author
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedItem && handleArchive(selectedItem.id, selectedItem.type)}
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Archive className="size-3.5" />
                Archive
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {/* Request Changes button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType('request_changes')}
                className="h-8 text-xs font-semibold gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
              >
                <AlertTriangle className="size-3.5" />
                Request Changes
              </Button>

              {/* Reject button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType('reject')}
                className="h-8 text-xs font-semibold gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>

              {/* Approve button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedItem && handleApprove(selectedItem.id, selectedItem.type)}
                className="h-8 text-xs font-bold gap-1.5 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="size-3.5" />
                Approve
              </Button>

              {/* Publish button */}
              <Button
                size="sm"
                onClick={() => selectedItem && handlePublish(selectedItem.id, selectedItem.type)}
                className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
              >
                <Globe className="size-3.5" />
                Publish Live
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sub-dialog for Request Changes, Reject & Transfer ─────────── */}
      <Dialog open={actionType !== null} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {actionType === 'request_changes' && 'Submit Feedback & Revisions to Contributor'}
              {actionType === 'reject' && 'Confirm Reject Submission'}
              {actionType === 'transfer' && 'Transfer Content Ownership'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {actionType === 'request_changes' && 'Contributor will receive this feedback under "Review Feedback" to edit and resubmit.'}
              {actionType === 'reject' && 'This submission will be marked as Rejected.'}
              {actionType === 'transfer' && 'Select another contributor to assign ownership of this content.'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'transfer' ? (
            <div className="py-2 space-y-2">
              <label className="text-xs font-bold text-foreground">Select New Author:</label>
              <select
                value={newAuthorId}
                onChange={(e) => setNewAuthorId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-card border border-border rounded-lg text-foreground font-medium"
              >
                {allUsers
                  .filter((u) => u.role === 'contributor' || u.role === 'admin')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <label className="text-xs font-bold text-foreground">Feedback Notes / Reason:</label>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter details regarding requested changes or quality notes..."
                className="text-xs min-h-[100px] bg-card"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActionType(null)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmActionDialog} className="text-xs font-bold">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
