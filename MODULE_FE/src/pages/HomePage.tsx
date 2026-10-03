import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Bug,
  Server,
  Cpu,
  Layers,
  Sparkles,
  Play,
  Terminal,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border bg-gradient-to-b from-accent/30 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide animate-in fade-in duration-500">
              <Sparkles className="size-3.5" />
              <span>Nền tảng thực hành Lab IT thế hệ mới</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Học IT bằng <span className="text-primary">thực hành thực tế.</span>
              <br />
              Không lý thuyết lan man.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Mỗi Series là chuỗi bài Lab thực chiến 15–30 phút. Viết code, bắt lỗi và kiểm thử tự động ngay trên trình duyệt xoay quanh <strong>1 dự án mẫu chuẩn doanh nghiệp</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/series">
                <Button size="lg" className="h-11 px-7 font-semibold gap-2 shadow-sm text-sm sm:text-base">
                  <Play className="size-4 fill-current" /> Bắt đầu làm bài Lab
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="h-11 px-6 text-sm sm:text-base gap-2">
                  Đăng ký miễn phí <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 w-full max-w-2xl text-xs text-muted-foreground">
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Chạy trực tiếp trên trình duyệt</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Web Worker tự động chấm tức thì</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>1 Dự án mẫu kết nối toàn diện</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. SECTION: TẠI SAO CHỌN SERIES LAB (VALUE PROPOSITION)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/40">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Phương pháp học tập mới</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Tại sao lại là mô hình Series Lab ngắn?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Các khóa học video thụ động có tỷ lệ bỏ dở lên tới 85%. StudyIT tập trung vào việc giúp bạn bắt tay vào làm và nhìn thấy kết quả ngay lập tức.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="size-5" />
                </div>
                <CardTitle className="text-lg">Bài Lab 15–30 phút</CardTitle>
                <CardDescription className="leading-relaxed">
                  Mỗi bài lab giải quyết trọn vẹn 1 task thực tế: phân loại 1 bug, test 1 endpoint, code 1 REST API hoặc tối ưu 1 Dockerfile.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Terminal className="size-5" />
                </div>
                <CardTitle className="text-lg">Không cần cài đặt phức tạp</CardTitle>
                <CardDescription className="leading-relaxed">
                  Mọi bài tập được biên dịch và chạy bằng Web Worker cô lập ngay trên trình duyệt. Bạn có thể học bất cứ lúc nào, ở bất kỳ máy tính nào.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle className="text-lg">Phản hồi tự động tức thì</CardTitle>
                <CardDescription className="leading-relaxed">
                  Bấm 'Chạy kiểm thử' để nhận ngay bảng điểm từng test case, biết chính xác logic của bạn sai ở đâu để sửa và tiến bộ ngay.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. SECTION: CÁC LỘ TRÌNH ĐÀO TẠO TRỌNG TÂM (CORE TRACKS)
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="tracks" className="py-14 sm:py-20 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Lộ trình học tập</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Chọn chuyên môn bạn muốn làm chủ
              </h2>
              <p className="text-sm text-muted-foreground">
                Được thiết kế theo chuẩn yêu cầu tuyển dụng thực tế tại các công ty công nghệ.
              </p>
            </div>
            <Link to="/series">
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
                Xem toàn bộ Series Lab <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Track 1: Tester */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
                    <Bug className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 01</Badge>
                </div>
                <CardTitle className="text-lg">Tester Chuyên Nghiệp</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Lộ trình từ Manual Testing, viết Test Case chuẩn quốc tế, kiểm thử API Postman/Swagger đến luyện đề thi ISTQB Foundation.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Quy trình Manual Test & Bug Life Cycle</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Test REST API với Postman & Swagger</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Bộ đề trắc nghiệm ISTQB có đáp án giải thích</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=testing" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground">
                    Khám phá Series Tester <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Track 2: Backend */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Server className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 02</Badge>
                </div>
                <CardTitle className="text-lg">Backend Developer</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Xây dựng kiến trúc backend chuẩn doanh nghiệp với NestJS, Prisma ORM, PostgreSQL và bảo mật JWT Silent Refresh.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Xây dựng RESTful API chuẩn nghiệp vụ</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>PostgreSQL & Prisma ORM Migration</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bảo mật JWT, HttpOnly Cookie & RBAC</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=backend" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-emerald-600 hover:text-white">
                    Khám phá Series Backend <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Track 3: DevOps */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Cpu className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 03</Badge>
                </div>
                <CardTitle className="text-lg">DevOps & CI/CD</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Đóng gói ứng dụng với Docker, thiết lập Docker Compose nhiều dịch vụ và tạo pipeline tự động hóa với GitHub Actions.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Viết Dockerfile đa tầng (Multi-stage build)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Quản lý môi trường với Docker Compose</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Pipeline GitHub Actions chạy test tự động</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=devops" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-amber-600 hover:text-white">
                    Khám phá Series DevOps <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. SECTION: TRẢI NGHIỆM THỰC HÀNH LAB (INTERACTIVE WORKSPACE SHOWCASE)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Giao diện Workspace trực quan</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Trải nghiệm thực hành như dự án thật
            </h2>
            <p className="text-sm text-muted-foreground">
              Đọc đề bài, viết code và quan sát test runner chạy tự động ngay trên trình duyệt mà không cần chuyển màn hình.
            </p>
          </div>

          {/* Simulated Lab Workspace Browser Window */}
          <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
                <span className="font-mono text-muted-foreground ml-2 text-[11px]">Lab Workspace · Lab #01: Phân loại Bug Severity</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ● Tự động chấm điểm
              </Badge>
            </div>

            {/* Window Content: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Left Column: Requirements & Instructions */}
              <div className="p-5 sm:p-6 space-y-4 bg-card">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">Đề bài thực hành</Badge>
                  <h4 className="text-sm font-bold text-foreground">Viết hàm phân loại mức độ nghiêm trọng của Bug</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Xây dựng hàm <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">classifyBug(desc)</code> để tự động gắn nhãn mức độ: critical, major, minor hoặc trivial dựa trên từ khóa trong mô tả lỗi.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground text-[11px]">Quy tắc phân loại:</p>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    <li>• Chứa "crash" hoặc "data loss" → <code className="text-red-500 font-semibold">'critical'</code></li>
                    <li>• Chứa "broken" hoặc "error" → <code className="text-amber-500 font-semibold">'major'</code></li>
                    <li>• Chứa "slow" hoặc "delay" → <code className="text-blue-500 font-semibold">'minor'</code></li>
                    <li>• Các trường hợp khác → <code className="text-muted-foreground font-semibold">'trivial'</code></li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Code & Test Output */}
              <div className="flex flex-col bg-muted/20">
                {/* Code editor snippet */}
                <div className="p-4 font-mono text-xs border-b border-border bg-card/80 text-foreground overflow-x-auto">
                  <p className="text-muted-foreground text-[11px] mb-2">// 1. Viết code giải quyết yêu cầu bài Lab</p>
                  <p className="text-blue-600 dark:text-blue-400">function <span className="text-amber-600 dark:text-amber-300">classifyBug</span>(desc) &#123;</p>
                  <p className="pl-4 text-muted-foreground">const text = desc.toLowerCase();</p>
                  <p className="pl-4 text-purple-600 dark:text-purple-400">if <span className="text-foreground">(text.includes('crash') || text.includes('data loss'))</span> &#123;</p>
                  <p className="pl-8 text-emerald-600 dark:text-emerald-400">return 'critical';</p>
                  <p className="pl-4 text-purple-600 dark:text-purple-400">&#125;</p>
                  <p className="pl-4 text-muted-foreground">... // Các trường hợp khác</p>
                  <p className="text-blue-600 dark:text-blue-400">&#125;</p>
                </div>

                {/* Test results banner */}
                <div className="p-4 space-y-2 bg-emerald-500/5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Kết quả kiểm thử: 5/5 PASSED (100%)</span>
                    <span className="font-mono text-[10px]">12ms</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Crash = Critical') — PASSED</p>
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Data loss = Critical') — PASSED</p>
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Broken = Major') — PASSED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. SECTION: ĐIỂM KHÁC BIỆT — 1 DỰ ÁN MẪU XUYÊN SUỐT
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/20 p-6 sm:p-10 shadow-sm space-y-8">
            <div className="max-w-2xl space-y-3">
              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">Điểm khác biệt cốt lõi</Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                1 Dự Án Mẫu Duy Nhất — Kết Nối Mọi Chuyên Môn
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thay vì làm các bài tập rời rạc không liên quan, tại StudyIT, tất cả bài lab của mọi môn học đều xoay quanh 1 ứng dụng web thực tế hoàn chỉnh. Bạn hiểu được bức tranh toàn cảnh khi đi làm việc nhóm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <Bug className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Tester</h4>
                <p className="text-xs text-muted-foreground">Khảo sát yêu cầu, phát hiện bug cố ý và viết test case chuẩn trên dự án.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <Server className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Backend</h4>
                <p className="text-xs text-muted-foreground">Code các API RESTful, kết nối PostgreSQL và xử lý logic theo đúng test spec.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  <Cpu className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">DevOps</h4>
                <p className="text-xs text-muted-foreground">Tạo Dockerfile đóng gói và cấu hình pipeline CI/CD chạy test tự động khi commit.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  <Layers className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Frontend</h4>
                <p className="text-xs text-muted-foreground">Giao diện mẫu trực quan giúp người học kiểm chứng luồng dữ liệu end-to-end.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. SECTION: QUY TRÌNH HỌC TẬP 4 BƯỚC (HOW IT WORKS)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Quy trình đơn giản</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Bắt đầu học trong 4 bước
            </h2>
            <p className="text-sm text-muted-foreground">
              Không cần chuẩn bị môi trường, không cần cài đặt công cụ phức tạp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">01</span>
              <h4 className="font-bold text-sm text-foreground">Chọn Series Lab</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lựa chọn chuyên môn Tester, Backend hoặc DevOps phù hợp với trình độ của bạn.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">02</span>
              <h4 className="font-bold text-sm text-foreground">Đọc đề & Hướng dẫn</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nghiên cứu tài liệu yêu cầu, tiêu chí nghiệm thu và mã mẫu có sẵn trong Workspace.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">03</span>
              <h4 className="font-bold text-sm text-foreground">Thực hành Code / Test</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Viết code trực tiếp và bấm 'Chạy kiểm thử' để nhận phản hồi từ Web Worker ngay lập tức.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">04</span>
              <h4 className="font-bold text-sm text-foreground">Tích lũy Tiến độ</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hoàn thành bài lab, mở khóa bài kế tiếp và theo dõi chuỗi học tập (streak) trên Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          7. SECTION: CALL TO ACTION (CTA)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-accent/40 to-primary/10 p-8 sm:p-14 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-xl mx-auto leading-tight">
              Sẵn sàng nâng cấp kỹ năng IT thực chiến của bạn?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Tham gia cùng hàng nghìn học viên đang thực hành mỗi ngày trên StudyIT. Bắt đầu với bài Lab đầu tiên hoàn toàn miễn phí.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/register">
                <Button size="lg" className="h-11 px-8 font-semibold shadow-md gap-2">
                  Tạo tài khoản miễn phí <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/series">
                <Button variant="outline" size="lg" className="h-11 px-6">
                  Duyệt danh mục bài Lab
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
