import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TermsPage() {
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
          <Shield className="size-3.5" />
          <span>Điều khoản dịch vụ chính thức</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Điều khoản dịch vụ (Terms of Service)
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
          <h2 className="text-lg font-bold text-foreground">1. Chấp thuận các điều khoản</h2>
          <p>
            Bằng việc truy cập hoặc sử dụng nền tảng thực hành lập trình <strong>StudyIT.dev</strong> (bao gồm website, hệ thống bài tập thực hành Labs, trình chấm điểm tự động Sandbox), bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản trong văn bản này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngừng sử dụng nền tảng.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Tài khoản & Bảo mật</h2>
          <p>
            Khi đăng ký tài khoản tại StudyIT, bạn cam kết cung cấp thông tin chính xác, cập nhật và chịu hoàn toàn trách nhiệm trong việc bảo mật mật khẩu và hoạt động diễn ra dưới tài khoản của bạn.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Không chia sẻ tài khoản hoặc thông tin đăng nhập cho nhiều người sử dụng chung.</li>
            <li>Thông báo ngay cho StudyIT qua <code className="text-xs bg-muted px-1.5 py-0.5 rounded">support@studyit.dev</code> nếu phát hiện dấu hiệu truy cập trái phép.</li>
            <li>StudyIT có quyền đình chỉ hoặc xóa các tài khoản vi phạm chính sách hoặc sử dụng bot/công cụ tự động để gian lận điểm số.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Quy định thực thi mã nguồn trên Sandbox</h2>
          <p>
            Hệ thống cung cấp môi trường thực thi Web Worker và Sandbox SQL/JS. Người dùng nghiêm cấm tuyệt đối các hành vi sau:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Tấn công DoS/DDoS, tiêu tốn tài nguyên trình duyệt hoặc máy chủ cố ý.</li>
            <li>Khai thác lỗ hổng bảo mật hoặc cố ý inject mã độc vào hệ thống chấm bài.</li>
            <li>Sao chép, bán lại hoặc khai thác thương mại các đề bài, test cases và giải pháp độc quyền khi chưa có văn bản chấp thuận từ ban quản trị.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. Gói thành viên & Quyền lợi PRO</h2>
          <p>
            Một số nội dung chuyên sâu được dán nhãn <strong>PRO Tier</strong> chỉ dành riêng cho tài khoản đăng ký gói PRO. Quyền truy cập PRO có hiệu lực theo kỳ hạn quy định. StudyIT cam kết duy trì chất lượng hệ thống và cập nhật nội dung thực hành định kỳ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ thương hiệu, giáo trình thực hành, mã kiểm thử và giao diện đồ họa thuộc quyền sở hữu trí tuệ của StudyIT.dev. Nội dung đóng góp từ cộng đồng Contributor được cấp phép sử dụng theo thỏa thuận đóng góp mã nguồn của nền tảng.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. Giới hạn trách nhiệm & Thay đổi điều khoản</h2>
          <p>
            StudyIT cung cấp nền tảng phục vụ mục đích học tập và rèn luyện kỹ năng kỹ thuật "nguyên trạng" (as-is). Chúng tôi có thể cập nhật Điều khoản dịch vụ bất cứ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang này.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Liên hệ hỗ trợ pháp lý: legal@studyit.dev</span>
        <Link to="/privacy" className="text-primary font-medium hover:underline">
          Xem Chính sách bảo mật →
        </Link>
      </div>
    </div>
  );
}
