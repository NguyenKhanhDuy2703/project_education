import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingAdminApi,
  type AdminUpgradeRequestItem,
  type UpgradeRequestStatus,
} from '@/features/admin/api/billing.admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  FileCheck2,
  Ban,
  UserCheck,
} from 'lucide-react';

function getStatusBadge(status: UpgradeRequestStatus) {
  switch (status) {
    case 'PENDING_REVIEW':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
          <Clock className="size-3" />
          <span>Chờ duyệt</span>
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1">
          <CheckCircle2 className="size-3" />
          <span>Đã duyệt</span>
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-500/30 bg-rose-500/10 gap-1">
          <XCircle className="size-3" />
          <span>Đã từ chối</span>
        </Badge>
      );
    case 'AWAITING_PAYMENT':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 bg-blue-500/10 gap-1">
          <Clock className="size-3" />
          <span>Chờ chuyển tiền</span>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border bg-muted/40 gap-1">
          <Ban className="size-3" />
          <span>Đã hủy</span>
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function AdminUpgradeRequestsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<UpgradeRequestStatus | 'ALL'>('PENDING_REVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [approvingItem, setApprovingItem] = useState<AdminUpgradeRequestItem | null>(null);
  const [approveForm, setApproveForm] = useState({ verifiedBankRef: '', verifiedAmount: 0 });

  const [rejectingItem, setRejectingItem] = useState<AdminUpgradeRequestItem | null>(null);
  const [rejectForm, setRejectForm] = useState({ reason: '' });

  const [viewingItem, setViewingItem] = useState<AdminUpgradeRequestItem | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-upgrade-requests', statusFilter, searchTerm, page],
    queryFn: () =>
      billingAdminApi.getUpgradeRequests({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        page,
        limit: 15,
      }),
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!approvingItem) throw new Error('No item');
      return billingAdminApi.approveUpgradeRequest(approvingItem.id, {
        verifiedBankRef: approveForm.verifiedBankRef.trim(),
        verifiedAmount: Number(approveForm.verifiedAmount),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-upgrade-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      showFeedback(`Đã phê duyệt yêu cầu của ${approvingItem?.user?.name || 'học viên'} và kích hoạt gói Pro`);
      setApprovingItem(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể phê duyệt yêu cầu';
      showFeedback(msg, 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!rejectingItem) throw new Error('No item');
      return billingAdminApi.rejectUpgradeRequest(rejectingItem.id, {
        reason: rejectForm.reason.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-upgrade-requests'] });
      showFeedback('Đã từ chối yêu cầu nâng cấp');
      setRejectingItem(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể từ chối yêu cầu';
      showFeedback(msg, 'error');
    },
  });

  const handleOpenApprove = (item: AdminUpgradeRequestItem) => {
    setApprovingItem(item);
    setApproveForm({
      verifiedBankRef: item.paymentReference || '',
      verifiedAmount: item.amount,
    });
  };

  const handleOpenReject = (item: AdminUpgradeRequestItem) => {
    setRejectingItem(item);
    setRejectForm({ reason: '' });
  };

  const requests = data?.items ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 15, totalPages: 1 };

  return (
    <div className="space-y-5">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {(['PENDING_REVIEW', 'ALL', 'AWAITING_PAYMENT', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className="text-xs h-8 px-2.5 whitespace-nowrap cursor-pointer"
            >
              {st === 'PENDING_REVIEW' && 'Chờ duyệt (Cần xử lý)'}
              {st === 'ALL' && 'Tất cả'}
              {st === 'AWAITING_PAYMENT' && 'Chờ chuyển'}
              {st === 'APPROVED' && 'Đã duyệt'}
              {st === 'REJECTED' && 'Từ chối'}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã GD, tên hoặc email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-2.5 px-4">Mã yêu cầu</th>
                <th className="py-2.5 px-4">Học viên</th>
                <th className="py-2.5 px-4">Gói cước</th>
                <th className="py-2.5 px-4">Số tiền</th>
                <th className="py-2.5 px-4">Mã GD nộp</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Đang tải danh sách yêu cầu...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">Không tìm thấy yêu cầu nào</p>
                    <p className="text-[11px] mt-0.5">Không có yêu cầu nâng cấp nào trong trạng thái đã chọn.</p>
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {item.transferRef}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{item.user?.name || 'Học viên'}</div>
                      <div className="text-[11px] text-muted-foreground">{item.user?.email || 'Chưa có email'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{item.plan?.name || 'Pro'}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.periodMonths} tháng</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      {Number(item.amount).toLocaleString()} {item.currency}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.paymentReference ? (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                          {item.paymentReference}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 italic">Chưa nộp</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingItem(item)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {item.status === 'PENDING_REVIEW' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenApprove(item)}
                              className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 font-bold gap-1"
                            >
                              <FileCheck2 className="size-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid="reject-request-btn"
                              onClick={() => handleOpenReject(item)}
                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-500/10"
                            >
                              <span>Từ chối</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Tổng cộng {meta.total} yêu cầu (Trang {meta.page}/{meta.totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 text-xs"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── APPROVE MODAL ────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(approvingItem)} onOpenChange={(open) => !open && setApprovingItem(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-600">
              <UserCheck className="size-5" />
              <span>Đối soát & Phê duyệt gói Pro</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vui lòng kiểm tra sao kê ngân hàng thực tế trước khi xác nhận kích hoạt gói Pro cho học viên.
            </DialogDescription>
          </DialogHeader>

          {approvingItem && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                approveMutation.mutate();
              }}
              className="space-y-4 py-2"
            >
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Học viên:</span>
                  <span className="font-bold text-foreground">{approvingItem.user?.name} ({approvingItem.user?.email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã chuyển khoản:</span>
                  <span className="font-mono font-bold text-primary">{approvingItem.transferRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền yêu cầu:</span>
                  <span className="font-bold text-foreground">
                    {Number(approvingItem.amount).toLocaleString()} {approvingItem.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã GD học viên nộp:</span>
                  <span className="font-mono text-foreground">{approvingItem.paymentReference || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Mã giao dịch ngân hàng thực tế (FT / GD số) *
                </label>
                <Input
                  required
                  placeholder="Ví dụ: FT261026001234 hoặc mã tra cứu sao kê"
                  value={approveForm.verifiedBankRef}
                  onChange={(e) => setApproveForm({ ...approveForm, verifiedBankRef: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Mã này phải là duy nhất trên toàn hệ thống để chống gian lận nộp trùng 1 biên lai.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Số tiền thực nhận (VND) *
                </label>
                <Input
                  type="number"
                  required
                  value={approveForm.verifiedAmount}
                  onChange={(e) => setApproveForm({ ...approveForm, verifiedAmount: Number(e.target.value) })}
                  className="h-9 text-xs font-bold font-mono"
                />
                {approveForm.verifiedAmount !== approvingItem.amount && (
                  <p className="text-[10px] text-rose-500 font-semibold">
                    Cảnh báo: Số tiền thực nhận ({Number(approveForm.verifiedAmount).toLocaleString()} VND) không khớp với số tiền của gói ({Number(approvingItem.amount).toLocaleString()} VND)!
                  </p>
                )}
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApprovingItem(null)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!approveForm.verifiedBankRef.trim() || approveMutation.isPending}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="size-3.5 mr-1" />
                  )}
                  <span>Xác nhận duyệt & Kích hoạt Pro</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── REJECT MODAL ─────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(rejectingItem)} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="size-5" />
              <span>Từ chối yêu cầu nâng cấp</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Lý do từ chối sẽ được thông báo trực tiếp đến hộp thư của học viên.
            </DialogDescription>
          </DialogHeader>

          {rejectingItem && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rejectMutation.mutate();
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Lý do từ chối *</label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Ví dụ: Chưa nhận được tiền trong tài khoản, sai cú pháp nội dung chuyển khoản, hoặc số tiền không khớp..."
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingItem(null)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={!rejectForm.reason.trim() || rejectMutation.isPending}
                  className="text-xs font-bold"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : (
                    <XCircle className="size-3.5 mr-1" />
                  )}
                  <span>Xác nhận từ chối</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── VIEW DETAIL MODAL ────────────────────────────────────────────────── */}
      <Dialog open={Boolean(viewingItem)} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              <span>Chi tiết yêu cầu: {viewingItem?.transferRef}</span>
            </DialogTitle>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Học viên:</span>
                  <span className="font-bold text-foreground">{viewingItem.user?.name}</span>
                  <div className="text-muted-foreground text-[11px]">{viewingItem.user?.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Trạng thái:</span>
                  <div className="pt-0.5">{getStatusBadge(viewingItem.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Gói cước:</span>
                  <span className="font-bold text-foreground">{viewingItem.plan?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Số tiền & Thời hạn:</span>
                  <span className="font-bold text-primary">
                    {Number(viewingItem.amount).toLocaleString()} {viewingItem.currency} ({viewingItem.periodMonths} tháng)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border">
                <div className="font-semibold text-foreground">Thông tin nộp tiền của học viên:</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã chuyển khoản:</span>
                  <span className="font-mono font-bold text-primary">{viewingItem.transferRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã tham chiếu nộp:</span>
                  <span className="font-mono text-foreground">{viewingItem.paymentReference || 'Chưa nộp'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian nộp:</span>
                  <span>{viewingItem.paymentConfirmedAt ? new Date(viewingItem.paymentConfirmedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {viewingItem.reviewedBy && (
                <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="font-semibold text-foreground">Thông tin đối soát của Admin:</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin xử lý:</span>
                    <span className="font-mono">
                      {typeof viewingItem.reviewedBy === 'object'
                        ? (viewingItem.reviewedBy as any)?.name || (viewingItem.reviewedBy as any)?.id
                        : viewingItem.reviewedBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời gian xử lý:</span>
                    <span>{viewingItem.reviewedAt ? new Date(viewingItem.reviewedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  {viewingItem.verifiedBankRef && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã GD sao kê thực tế:</span>
                      <span className="font-mono font-bold text-emerald-600">{viewingItem.verifiedBankRef}</span>
                    </div>
                  )}
                  {viewingItem.verifiedAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số tiền đối soát:</span>
                      <span className="font-bold text-emerald-600">{Number(viewingItem.verifiedAmount).toLocaleString()} VND</span>
                    </div>
                  )}
                  {viewingItem.rejectionReason && (
                    <div className="pt-1">
                      <span className="text-rose-500 font-semibold block">Lý do từ chối:</span>
                      <p className="text-rose-600 mt-0.5 whitespace-pre-line">{viewingItem.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setViewingItem(null)} className="text-xs">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
