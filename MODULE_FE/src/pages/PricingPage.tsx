import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Crown, Check, ArrowRight, Zap, HelpCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/stores/store';
import { billingApi } from '@/features/billing/api/billingApi';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { data: catalog, isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: billingApi.getPublicPlans,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership-me'],
    queryFn: billingApi.getMembershipState,
    enabled: Boolean(user),
  });

  const proPlan = catalog?.plans.find((p) => p.code === 'PRO_MONTHLY');
  const isAvailable = Boolean(catalog?.intakeEnabled && proPlan?.isSaleReady);

  const createRequestMutation = useMutation({
    mutationFn: (planId: string) => billingApi.createUpgradeRequest(planId),
    onSuccess: () => {
      navigate('/membership');
    },
    onError: () => {
      navigate('/membership');
    },
  });

  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login?redirect=/membership');
      return;
    }
    if (membership?.openRequest) {
      navigate('/membership');
      return;
    }
    if (proPlan) {
      createRequestMutation.mutate(proPlan.id);
    } else {
      navigate('/membership');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl space-y-16">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Crown className="size-3.5" />
          <span>Gói thành viên StudyIT PRO</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Đầu tư vào kỹ năng thực chiến, <span className="text-primary">luyện tập bài bản.</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Nâng cao kỹ năng kiểm thử và cơ sở dữ liệu với kho bài thực hành SQL & Quiz nâng cao.
          Thanh toán chuyển khoản ngân hàng minh bạch và đối soát thủ công an toàn.
        </p>

        {user && membership && (
          <div className="pt-2">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-semibold ${
                membership.isPro
                  ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                  : 'text-muted-foreground bg-muted/40'
              }`}
            >
              Trạng thái tài khoản của bạn:{' '}
              <strong className="ml-1">{membership.isPro ? 'StudyIT PRO' : 'Gói Miễn phí'}</strong>
              {membership.endDate && (
                <span className="ml-1">
                  (hết hạn: {new Date(membership.endDate).toLocaleDateString('vi-VN')})
                </span>
              )}
            </Badge>
          </div>
        )}
      </div>

      {/* ── Pricing Cards Grid (Monthly only in v1) ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs font-semibold uppercase">
                Free Learner
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">Học tập miễn phí</h3>
              <p className="text-xs text-muted-foreground">
                Làm quen với nền tảng qua các bài thực hành SQL và trắc nghiệm cơ bản.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">0đ</span>
              <span className="text-xs text-muted-foreground">/ mãi mãi</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Quyền lợi bao gồm:
              </span>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Truy cập các bài thực hành SQL & Quiz cơ bản (Free Preview)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Chạy truy vấn SQL trực tiếp trong trình duyệt qua PGlite Engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Tự động chấm điểm và đánh giá kết quả tức thì</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Lưu các chuỗi bài học yêu thích vào thư viện cá nhân</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <Button variant="outline" asChild className="w-full h-11 font-semibold gap-2">
              <Link to="/series">
                <span>Khám phá bài học miễn phí</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* PRO MONTHLY PLAN */}
        <div className="relative rounded-2xl border-2 border-primary bg-card p-8 flex flex-col justify-between shadow-xl shadow-primary/5">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 shadow-sm text-xs gap-1.5">
              <Crown className="size-3.5" />
              <span>GÓI PRO HÀNG THÁNG</span>
            </Badge>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold"
              >
                StudyIT PRO Monthly
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">Thành viên Pro Chuyên sâu</h3>
              <p className="text-xs text-muted-foreground">
                Mở khóa toàn bộ kho bài thực hành SQL nâng cao, câu hỏi tình huống và giải pháp.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {proPlan ? `${proPlan.price.toLocaleString('vi-VN')}đ` : '199.000đ'}
              </span>
              <span className="text-xs text-muted-foreground">/ 1 tháng dương lịch</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Quyền lợi Pro bao gồm:
              </span>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5 font-medium text-foreground">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Mở khóa 100% bài thực hành SQL nâng cao (JOIN, CTE, Window Functions)</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium text-foreground">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Toàn bộ bài kiểm tra Tester Quiz Checkpoint chuyên sâu</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Mở khóa xem lời giải chi tiết và đáp án sau khi hoàn thành bài tập</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>AI gợi ý và giải thích lỗi kiểm thử tự động</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Cộng dồn thời hạn linh hoạt khi gia hạn sớm trước ngày hết hạn</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-2">
            <Button
              onClick={handleUpgradeClick}
              disabled={loadingPlans || (!isAvailable && !membership?.openRequest)}
              className="w-full h-11 font-bold gap-2 text-sm shadow-md"
            >
              {createRequestMutation.isPending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              <span>
                {membership?.openRequest
                  ? 'Xem yêu cầu chuyển khoản đang mở'
                  : isAvailable
                  ? membership?.isPro
                    ? 'Gia hạn thêm 1 tháng'
                    : 'Nâng cấp ngay với StudyIT PRO'
                  : 'Cổng mua đang tạm đóng'}
              </span>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Thanh toán chuyển khoản ngân hàng · Admin đối soát và kích hoạt trong giờ làm việc
            </p>
          </div>
        </div>
      </div>

      {/* ── Contributor Callout ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
            <ShieldCheck className="size-4" />
            <span>Dành cho Tác giả đóng góp nội dung</span>
          </div>
          <h4 className="text-lg font-bold text-foreground">
            Bạn muốn đóng góp giáo trình hoặc bài Lab cho cộng đồng?
          </h4>
          <p className="text-xs text-muted-foreground max-w-xl">
            Tác giả (Contributor) được cấp quyền Studio để soạn thảo và gửi duyệt nội dung bài tập,
            đồng thời giữ nguyên quyền xem lời giải của các bài do chính mình biên soạn.
          </p>
        </div>
        <Button variant="outline" asChild className="shrink-0 h-10 text-xs font-semibold">
          <Link to={user ? '/user/dashboard/profile' : '/login?redirect=/user/dashboard/profile'}>
            Đăng ký làm Contributor →
          </Link>
        </Button>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <HelpCircle className="size-3.5" />
            <span>Câu hỏi thường gặp</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground">Giải đáp thắc mắc</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Quy trình kích hoạt Pro diễn ra như thế nào?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Bạn tạo yêu cầu nâng cấp, hệ thống sẽ cấp mã chuyển khoản duy nhất. Sau khi bạn chuyển khoản và gửi mã giao dịch, ban quản trị sẽ đối soát và kích hoạt Pro cho tài khoản.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Gia hạn sớm có bị mất ngày sử dụng không?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Không. Nếu bạn gia hạn trước khi hết hạn, hệ thống sẽ tự động cộng thêm 1 tháng dương lịch tính từ ngày hết hạn hiện tại của bạn.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Khi nào tôi xem được lời giải bài tập?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Để đảm bảo hiệu quả thực học, lời giải tham khảo chính thức sẽ được mở khóa sau khi bạn đã vượt qua tất cả bài kiểm tra của bài thực hành đó.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Tôi có thể hủy yêu cầu nâng cấp không?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Có. Nếu chưa chuyển khoản hoặc chưa gửi xác nhận thanh toán, bạn có thể bấm nút "Hủy yêu cầu" trong trang Quản lý gói thành viên bất kỳ lúc nào.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
