import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, ArrowRight, Zap, HelpCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/stores/store';

export function PricingPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl space-y-16">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Crown className="size-3.5" />
          <span>Bảng giá & Gói thành viên StudyIT PRO</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Đầu tư vào kỹ năng thực chiến, <span className="text-primary">không học vẹt.</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Thực hành trực tiếp trên sandbox với các bài toán thực tế của doanh nghiệp. Mở khóa toàn bộ giáo trình nâng cao cùng StudyIT PRO.
        </p>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center p-1 bg-muted rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Thanh toán tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Thanh toán năm</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">
                Tiết kiệm 35%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Pricing Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs font-semibold uppercase">
                Learner Free
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">Khởi động miễn phí</h3>
              <p className="text-xs text-muted-foreground">
                Dành cho lập trình viên mới bắt đầu tiếp cận phương pháp học thực hành.
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
                  <span>Truy cập toàn bộ Series nhập môn và bài tập cơ bản</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Chạy code trên JS Worker & SQL in-browser Sandbox</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Theo dõi Streak học tập và lịch sử nộp bài</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Lưu các Series yêu thích vào tài khoản cá nhân</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <Button variant="outline" asChild className="w-full h-11 font-semibold gap-2">
              <Link to="/series">
                <span>Khám phá Series miễn phí</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* PRO PLAN */}
        <div className="relative rounded-2xl border-2 border-primary bg-card p-8 flex flex-col justify-between shadow-xl shadow-primary/5">
          {/* Top highlight badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 shadow-sm text-xs gap-1.5">
              <Crown className="size-3.5" />
              <span>GÓI ĐƯỢC CHỌN NHIỀU NHẤT</span>
            </Badge>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                StudyIT PRO
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">Lập trình viên chuyên nghiệp</h3>
              <p className="text-xs text-muted-foreground">
                Mở khóa tất cả bài thực hành enterprise và giải pháp chuẩn sản phẩm.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {billingCycle === 'yearly' ? '129.000đ' : '199.000đ'}
              </span>
              <span className="text-xs text-muted-foreground">/ tháng</span>
              {billingCycle === 'yearly' && (
                <span className="text-[11px] text-muted-foreground ml-1">
                  (thu 1.548.000đ / năm)
                </span>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Mọi quyền lợi của Free, cộng thêm:
              </span>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5 font-medium text-foreground">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Mở khóa 100% Series PRO (DevOps, QA Automation, Microservices)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Xem mã nguồn lời giải mẫu và test cases chuyên sâu</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Huy hiệu PRO nổi bật trên hồ sơ cá nhân và bảng xếp hạng</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-primary shrink-0" />
                  <span>Ưu tiên giải đáp thắc mắc kỹ thuật từ ban biên tập</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <Button asChild className="w-full h-11 font-bold gap-2 text-sm shadow-md">
              <a href="mailto:pro@studyit.dev?subject=Y%C3%AAu%20c%E1%BA%A7u%20n%C3%A2ng%20c%E1%BA%A5p%20StudyIT%20PRO">
                <Zap className="size-4" />
                <span>Nâng cấp ngay với StudyIT PRO</span>
              </a>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Kích hoạt ngay trong 5 phút · Hỗ trợ chuyển khoản hoặc thẻ
            </p>
          </div>
        </div>
      </div>

      {/* ── Contributor Callout ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
            <ShieldCheck className="size-4" />
            <span>Chính sách miễn phí cho Contributor</span>
          </div>
          <h4 className="text-lg font-bold text-foreground">
            Bạn muốn đóng góp giáo trình hoặc bài Lab cho cộng đồng?
          </h4>
          <p className="text-xs text-muted-foreground max-w-xl">
            Tất cả tác giả (Contributor) có bài giảng được duyệt chính thức sẽ được <strong>tặng tài khoản PRO miễn phí</strong> vĩnh viễn cùng nhuận bút đóng góp nội dung.
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
            <h5 className="font-bold text-foreground">Tôi có thể hủy gói PRO bất cứ lúc nào không?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Có. Bạn có thể chủ động hủy gói gia hạn bất kỳ lúc nào mà không phát sinh thêm chi phí nào.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Phương thức thanh toán được hỗ trợ?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi hỗ trợ quét mã VietQR ngân hàng, MoMo, ZaloPay và thẻ thanh toán quốc tế Visa/MasterCard.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Có xuất hóa đơn VAT cho doanh nghiệp không?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Có. StudyIT xuất hóa đơn điện tử VAT đầy đủ khi bạn đăng ký gói đào tạo cho cá nhân hoặc doanh nghiệp.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h5 className="font-bold text-foreground">Làm sao để nhận hỗ trợ khi gặp sự cố?</h5>
            <p className="text-muted-foreground leading-relaxed">
              Vui lòng gửi email đến support@studyit.dev. Đội ngũ kỹ thuật trực 24/7 sẽ phản hồi trong vòng 30 phút.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
