import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold px-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="size-3.5" />
            Trang chủ StudyIT
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Lock className="size-3.5" />
          <span>Cam kết bảo vệ quyền riêng tư</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Chính sách bảo mật (Privacy Policy)
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>Cập nhật lần cuối: Tháng 10, 2026</span>
          <span>·</span>
          <span>Phiên bản 2.1</span>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Thu thập dữ liệu</h2>
          <p>
            StudyIT.dev cam kết tôn trọng và bảo vệ tối đa dữ liệu cá nhân của người học. Khi bạn tương tác với nền tảng, chúng tôi chỉ thu thập các thông tin thực sự cần thiết để vận hành và cá nhân hóa trải nghiệm học tập:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Thông tin tài khoản:</strong> Họ tên, địa chỉ email, số điện thoại (nếu có), ảnh đại diện (avatar).</li>
            <li><strong>Dữ liệu xác thực Google OAuth:</strong> Khi đăng nhập qua Google, chúng tôi nhận email và tên công khai được cấp phép thông qua OAuth token chuẩn. Mật khẩu Google của bạn không bao giờ được gửi đến máy chủ của chúng tôi.</li>
            <li><strong>Dữ liệu học tập & nộp bài:</strong> Tiến độ hoàn thành bài lab, điểm số, lịch sử chấm code, streak học tập.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Mục đích sử dụng dữ liệu</h2>
          <p>Dữ liệu của bạn được sử dụng nhằm mục đích:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Duy trì phiên đăng nhập bảo mật và xác thực quyền hạn (User, Contributor, Admin, Pro).</li>
            <li>Lưu trữ tiến độ học tập, tổng hợp streak và cấp chứng nhận hoàn thành series.</li>
            <li>Gửi các thông báo quan trọng liên quan đến tài khoản và bảo mật hệ thống.</li>
            <li>Không bao giờ bán, cho thuê hoặc chia sẻ dữ liệu người dùng cho bất kỳ bên thứ ba vì mục đích quảng cáo thương mại.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Cookie & Lưu trữ cục bộ (LocalStorage)</h2>
          <p>
            Hệ thống sử dụng HttpOnly Secure Cookie cho JWT Token nhằm phòng chống tấn công XSS (Cross-Site Scripting), và LocalStorage cho các cài đặt giao diện (giao diện Sáng/Tối, trạng thái thanh bên thu gọn, bộ lọc danh mục).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. Bảo mật dữ liệu & Quyền của người dùng</h2>
          <p>
            Mọi kết nối dữ liệu được mã hóa bằng giao thức HTTPS/TLS 1.3 tiêu chuẩn công nghiệp. Bạn có toàn quyền yêu cầu:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Xem và cập nhật thông tin cá nhân trong mục Cài đặt hồ sơ cá nhân (<Link to="/user/dashboard/profile" className="text-primary hover:underline">Profile</Link>).</li>
            <li>Yêu cầu trích xuất toàn bộ dữ liệu lịch sử nộp bài.</li>
            <li>Yêu cầu xóa vĩnh viễn tài khoản và dữ liệu liên quan qua email <code className="text-xs bg-muted px-1.5 py-0.5 rounded">privacy@studyit.dev</code>.</li>
          </ul>
        </section>
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Liên hệ phụ trách bảo mật: privacy@studyit.dev</span>
        <Link to="/terms" className="text-primary font-medium hover:underline">
          Xem Điều khoản dịch vụ →
        </Link>
      </div>
    </div>
  );
}
