import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Check, Copy, CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { billingApi } from '../api/billingApi';
import type { MembershipState, UpgradeRequestRecord } from '../types/billing.types';

export function MembershipView() {
  const queryClient = useQueryClient();
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [txRefInput, setTxRefInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: membership, isLoading: loadingMember, refetch: refetchMember } = useQuery<MembershipState>({
    queryKey: ['membership-me'],
    queryFn: billingApi.getMembershipState,
  });

  const { data: publicCatalog, isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: billingApi.getPublicPlans,
  });

  const { data: historyRequests = [], refetch: refetchHistory } = useQuery<UpgradeRequestRecord[]>({
    queryKey: ['my-upgrade-requests'],
    queryFn: billingApi.getMyUpgradeRequests,
  });

  const proPlan = publicCatalog?.plans.find((p) => p.code === 'PRO_MONTHLY');

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: (planId: string) => billingApi.createUpgradeRequest(planId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['membership-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-upgrade-requests'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'Không thể tạo yêu cầu nâng cấp');
    },
  });

  const submitTxMutation = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) =>
      billingApi.submitPaymentConfirmation(id, ref),
    onSuccess: () => {
      setActionError(null);
      setTxRefInput('');
      queryClient.invalidateQueries({ queryKey: ['membership-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-upgrade-requests'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'Không thể gửi mã xác nhận thanh toán');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => billingApi.cancelUpgradeRequest(id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['membership-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-upgrade-requests'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'Không thể hủy yêu cầu');
    },
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  if (loadingMember || loadingPlans) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
        <RefreshCw className="size-4 animate-spin mr-2" />
        Đang tải thông tin thành viên...
      </div>
    );
  }

  const openReq = membership?.openRequest;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Crown className="size-6 text-primary" />
            <span>Gói thành viên & Thanh toán Pro</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quản lý gói học tập, theo dõi hạn sử dụng và tiến trình nâng cấp tài khoản qua chuyển khoản ngân hàng.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchMember();
            refetchHistory();
          }}
          className="self-start text-xs gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          <span>Làm mới</span>
        </Button>
      </div>

      {actionError && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Current Membership Status Card ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Trạng thái hiện tại</span>
          <Badge
            className={`text-xs px-2.5 py-0.5 font-bold ${
              membership?.isPro
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {membership?.isPro ? 'StudyIT PRO' : 'Tài khoản Miễn phí'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <span className="text-xs text-muted-foreground">Gói sở hữu</span>
            <p className="text-base font-bold text-foreground mt-0.5">{membership?.planName || 'Free Tier'}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Nguồn cấp quyền (Provenance)</span>
            <p className="text-xs font-medium text-foreground mt-1">
              {membership?.provenance === 'DIRECT_SUBSCRIPTION' && 'Đăng ký trực tiếp (Pro Monthly)'}
              {membership?.provenance === 'GROUP_MEMBERSHIP' && 'Nhóm thành viên IAM'}
              {membership?.provenance === 'ADMIN_ROLE' && 'Đặc quyền Quản trị viên'}
              {membership?.provenance === 'FREE' && 'Gói mặc định Free'}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Thời hạn hiệu lực</span>
            <p className="text-xs font-medium text-foreground mt-1">
              {membership?.endDate ? (
                <>
                  Đến ngày <strong>{new Date(membership.endDate).toLocaleDateString('vi-VN')}</strong>
                  {membership.isExpired && (
                    <span className="text-rose-500 font-bold ml-1.5">(Đã hết hạn)</span>
                  )}
                </>
              ) : membership?.isPro ? (
                'Không giới hạn thời gian'
              ) : (
                'Mãi mãi (Free)'
              )}
            </p>
          </div>
        </div>

        {membership?.isPro && !membership?.endDate && (
          <p className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
            {membership.purchaseIneligibilityReason ||
              'Tài khoản của bạn đã được kích hoạt đặc quyền Pro vĩnh viễn.'}
          </p>
        )}
      </div>

      {/* ── Active Upgrade Request in Progress ─────────────────────────────── */}
      {openReq && (
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Đang xử lý yêu cầu nâng cấp Pro ({openReq.period})
              </h3>
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-bold uppercase ${
                openReq.status === 'AWAITING_PAYMENT'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              }`}
            >
              {openReq.status === 'AWAITING_PAYMENT' ? 'Chờ thanh toán' : 'Chờ đối soát'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-card p-4 rounded-xl border border-border">
            <div className="space-y-2">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                Thông tin chuyển khoản
              </span>
              <div className="space-y-1">
                <p>
                  Ngân hàng: <strong>{openReq.bankSnapshot.bankName}</strong> ({openReq.bankSnapshot.bankCode})
                </p>
                <p className="flex items-center gap-1.5">
                  Số tài khoản: <strong className="font-mono text-sm">{openReq.bankSnapshot.accountNumber}</strong>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-muted-foreground"
                    onClick={() => handleCopy(openReq.bankSnapshot.accountNumber, 'STK')}
                  >
                    {copySuccess === 'STK' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </p>
                <p>
                  Chủ tài khoản: <strong>{openReq.bankSnapshot.accountHolder}</strong>
                </p>
                <p className="text-primary font-bold text-sm">
                  Số tiền cần chuyển: {Number(openReq.priceSnapshot).toLocaleString('vi-VN')} {openReq.currency}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                Mã chuyển khoản (bắt buộc ghi trong nội dung)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold bg-muted px-3 py-1.5 rounded-lg border border-border tracking-wider text-foreground">
                  {openReq.transferReference}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(openReq.transferReference, 'REF')}
                  className="gap-1 text-xs"
                >
                  {copySuccess === 'REF' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copySuccess === 'REF' ? 'Đã chép' : 'Sao chép'}</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hệ thống đối soát dựa trên mã chuyển khoản này. Vui lòng không thay đổi mã.
              </p>
            </div>
          </div>

          {openReq.status === 'AWAITING_PAYMENT' ? (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-foreground block">
                Sau khi chuyển khoản, nhập mã giao dịch của ngân hàng để gửi xác nhận:
              </label>
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                <Input
                  placeholder="Ví dụ: FT241026001234, MB12345678..."
                  value={txRefInput}
                  onChange={(e) => setTxRefInput(e.target.value)}
                  className="text-xs h-9 bg-card"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (txRefInput.trim()) {
                      submitTxMutation.mutate({ id: openReq.id, ref: txRefInput.trim() });
                    }
                  }}
                  disabled={!txRefInput.trim() || submitTxMutation.isPending}
                  className="shrink-0 text-xs font-bold gap-1.5"
                >
                  {submitTxMutation.isPending ? <RefreshCw className="size-3 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  <span>Tôi đã chuyển khoản</span>
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelMutation.mutate(openReq.id)}
                  disabled={cancelMutation.isPending}
                  className="text-xs text-muted-foreground hover:text-rose-500 gap-1.5"
                >
                  <XCircle className="size-3.5" />
                  <span>Hủy yêu cầu này</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5 text-blue-700 dark:text-blue-300">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>Đã ghi nhận mã giao dịch: {openReq.paymentReference}</span>
              </p>
              <p className="text-muted-foreground text-[11px]">
                Ban quản trị đang tiến hành đối soát với tài khoản ngân hàng. Tài khoản sẽ được nâng cấp Pro ngay khi đối soát khớp.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Purchase / Renewal CTA if no open request ─────────────────────── */}
      {!openReq && membership?.canPurchase && proPlan && (
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground">
              {membership.isPro ? 'Gia hạn thêm 1 tháng StudyIT PRO' : 'Nâng cấp tài khoản lên StudyIT PRO'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              {membership.isPro
                ? 'Gia hạn sớm sẽ cộng thêm 1 tháng dương lịch tính từ ngày hết hạn hiện tại của bạn.'
                : 'Mở khóa toàn bộ bài thực hành SQL & Quiz nâng cao, xem giải pháp và nhận AI review.'}
            </p>
            <p className="text-primary font-bold text-sm">
              Giá: {proPlan.price.toLocaleString('vi-VN')} VND / tháng
            </p>
          </div>

          <Button
            onClick={() => createRequestMutation.mutate(proPlan.id)}
            disabled={!proPlan.isAvailableForPurchase || createRequestMutation.isPending}
            className="shrink-0 h-11 px-6 font-bold text-xs gap-2"
          >
            {createRequestMutation.isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Crown className="size-4" />
            )}
            <span>
              {proPlan.isAvailableForPurchase
                ? membership.isPro
                  ? 'Gia hạn Pro ngay'
                  : 'Tạo yêu cầu nâng cấp Pro'
                : 'Cổng mua đang tạm đóng'}
            </span>
          </Button>
        </div>
      )}

      {/* ── Request History ───────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
          Lịch sử yêu cầu nâng cấp ({historyRequests.length})
        </h4>

        {historyRequests.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Chưa có lịch sử giao dịch nào.
          </div>
        ) : (
          <div className="space-y-2">
            {historyRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{req.transferReference}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10'
                          : req.status === 'REJECTED'
                          ? 'text-rose-600 border-rose-500/30 bg-rose-500/10'
                          : req.status === 'CANCELLED'
                          ? 'text-muted-foreground border-border bg-muted/40'
                          : 'text-amber-600 border-amber-500/30 bg-amber-500/10'
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Số tiền: {Number(req.priceSnapshot).toLocaleString('vi-VN')} {req.currency} · Tạo lúc:{' '}
                    {new Date(req.createdAt).toLocaleString('vi-VN')}
                  </p>
                  {req.reviewReason && (
                    <p className="text-rose-500 text-[11px]">Lý do từ chối: {req.reviewReason}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {req.paymentReference && (
                    <p className="text-[11px] text-muted-foreground">
                      Mã GD: <span className="font-mono font-semibold">{req.paymentReference}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
