import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contributorApplicationApi,
  type ContributorApplicationItem,
} from '@/features/contributor/api/contributor-application.api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Award,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  User,
  Eye,
} from 'lucide-react';

export function AdminContributorApplicationsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<ContributorApplicationItem | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    app: ContributorApplicationItem | null;
    action: 'APPROVE' | 'REJECT';
    adminNote: string;
  }>({
    open: false,
    app: null,
    action: 'APPROVE',
    adminNote: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-contributor-applications', statusFilter],
    queryFn: () => contributorApplicationApi.getAdminApplications({ status: statusFilter }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, adminNote }: { id: string; action: 'APPROVE' | 'REJECT'; adminNote?: string }) =>
      contributorApplicationApi.reviewApplication(id, { action, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contributor-applications'] });
      setActionModal((prev) => ({ ...prev, open: false }));
      if (selectedApp) setSelectedApp(null);
    },
  });

  const filteredItems = (data?.items || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = item.user?.name?.toLowerCase() || '';
    const email = item.user?.email?.toLowerCase() || '';
    const bio = item.bio.toLowerCase();
    const topic = item.sampleTopic.toLowerCase();
    return name.includes(q) || email.includes(q) || bio.includes(q) || topic.includes(q);
  });

  const handleOpenReview = (app: ContributorApplicationItem, action: 'APPROVE' | 'REJECT') => {
    setActionModal({
      open: true,
      app,
      action,
      adminNote: action === 'APPROVE' ? 'Welcome to the content contributor team!' : '',
    });
  };

  const handleConfirmReview = () => {
    if (!actionModal.app) return;
    reviewMutation.mutate({
      id: actionModal.app.id,
      action: actionModal.action,
      adminNote: actionModal.adminNote.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Award className="size-6" />
            <h1 className="text-2xl font-bold text-foreground">Contributor Applications Review</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and grant content contributor permissions to qualified learners.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-4 border-border bg-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="PENDING" className="gap-1.5 text-xs">
                <Clock className="size-3.5" />
                <span>Pending</span>
              </TabsTrigger>
              <TabsTrigger value="APPROVED" className="gap-1.5 text-xs">
                <CheckCircle2 className="size-3.5" />
                <span>Approved</span>
              </TabsTrigger>
              <TabsTrigger value="REJECTED" className="gap-1.5 text-xs">
                <XCircle className="size-3.5" />
                <span>Rejected</span>
              </TabsTrigger>
              <TabsTrigger value="ALL" className="text-xs">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Applications list */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Loading contributor applications...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Award className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-base text-foreground">No applications found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No applications match the current filter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((app) => (
            <Card key={app.id} className="p-5 border-border hover:shadow-sm transition-shadow space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{app.user?.name || 'Learner'}</h3>
                    <p className="text-xs text-muted-foreground">{app.user?.email || app.user?.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'PENDING' && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold gap-1">
                      <Clock className="size-3" />
                      Pending
                    </Badge>
                  )}
                  {app.status === 'APPROVED' && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1">
                      <CheckCircle2 className="size-3" />
                      Approved
                    </Badge>
                  )}
                  {app.status === 'REJECTED' && (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs font-semibold gap-1">
                      <XCircle className="size-3" />
                      Rejected
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>

              {/* Bio & Proposal */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Professional Background:</span>
                  <p className="text-muted-foreground line-clamp-2 bg-muted/30 p-2.5 rounded border">
                    {app.bio}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Proposed Topic / Lab:</span>
                  <p className="text-muted-foreground line-clamp-2 bg-muted/30 p-2.5 rounded border">
                    {app.sampleTopic}
                  </p>
                </div>
              </div>

              {/* Footer info & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  {app.portfolioUrl ? (
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>View Portfolio / GitHub</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No portfolio link provided</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Eye className="size-3.5" />
                    <span>Details</span>
                  </Button>

                  {app.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs"
                        onClick={() => handleOpenReview(app, 'REJECT')}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => handleOpenReview(app, 'APPROVE')}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={actionModal.open} onOpenChange={(open) => setActionModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {actionModal.action === 'APPROVE' ? 'Approve Contributor Application' : 'Reject Contributor Application'}
            </DialogTitle>
            <DialogDescription>
              {actionModal.action === 'APPROVE'
                ? `Grant Contributor privileges to ${actionModal.app?.user?.name || ''}. They will be able to access Contributor Studio immediately.`
                : `Reject application for ${actionModal.app?.user?.name || ''}. The reason will be communicated to the applicant.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-foreground">
              {actionModal.action === 'APPROVE' ? 'Welcome Message (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <Textarea
              rows={3}
              placeholder={
                actionModal.action === 'APPROVE'
                  ? 'Welcome to the StudyIT content creation community!'
                  : 'Please provide additional details on your experience or link to sample labs...'
              }
              value={actionModal.adminNote}
              onChange={(e) => setActionModal((prev) => ({ ...prev, adminNote: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              variant={actionModal.action === 'APPROVE' ? 'default' : 'destructive'}
              disabled={reviewMutation.isPending || (actionModal.action === 'REJECT' && !actionModal.adminNote.trim())}
              onClick={handleConfirmReview}
              className={actionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : ''}
            >
              {reviewMutation.isPending ? 'Processing...' : actionModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Applicant: {selectedApp?.user?.name} ({selectedApp?.user?.email})
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="font-semibold text-foreground">Experience &amp; Background:</span>
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                  {selectedApp.bio}
                </p>
              </div>

              <div>
                <span className="font-semibold text-foreground">Proposed Topic / Lab Idea:</span>
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                  {selectedApp.sampleTopic}
                </p>
              </div>

              {selectedApp.portfolioUrl && (
                <div>
                  <span className="font-semibold text-foreground">Portfolio / GitHub: </span>
                  <a
                    href={selectedApp.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1 ml-1"
                  >
                    {selectedApp.portfolioUrl}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              {selectedApp.adminNote && (
                <div className="p-3 rounded-md bg-muted border">
                  <span className="font-semibold text-foreground">Admin Response Note: </span>
                  <p className="mt-0.5 text-muted-foreground">{selectedApp.adminNote}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
