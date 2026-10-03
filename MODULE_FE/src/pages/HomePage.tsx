import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, FileCode, Layers, GraduationCap, Server, Bug, Cpu } from 'lucide-react';

export function HomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-16 max-w-5xl">

      {/* Hero */}
      <div className="flex flex-col items-center text-center space-y-5 max-w-2xl mx-auto">
        <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
          Testing · Backend · Docker · CI/CD
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Học IT bằng cách{' '}
          <span className="text-primary">thực hành thực tế.</span>
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          Mỗi Series là một chuỗi bài Lab ngắn (15–30 phút) — viết code ngay trên trình duyệt,
          thấy kết quả tức thì, không cần cài đặt.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/register">
            <Button size="lg" className="h-10 px-6 font-semibold gap-2">
              Bắt đầu miễn phí <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/series">
            <Button variant="outline" size="lg" className="h-10 px-6">
              Khám phá Series Lab
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" />Chạy code ngay trên browser</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" />Kiểm thử tự động bằng Web Worker</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" />Theo dõi tiến độ theo từng Series</span>
        </div>
      </div>

      {/* 2 Core Learning Paths */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xl font-bold tracking-tight">2 Lộ trình chính</h2>
          <Link to="/series" className="text-xs font-semibold text-primary hover:underline">
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/series?topic=testing" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Bug className="size-4" />
                  </div>
                  <Badge variant="outline" className="text-[11px]">01</Badge>
                </div>
                <CardTitle>Tester chuyên nghiệp</CardTitle>
                <CardDescription>Viết Test Case, kiểm thử API, luyện thi ISTQB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-4">
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Thực hành tìm lỗi trên app mẫu</p>
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Test API với Postman & Swagger</p>
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Bộ đề trắc nghiệm ISTQB Foundation</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/series?topic=backend" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Server className="size-4" />
                  </div>
                  <Badge variant="outline" className="text-[11px]">02</Badge>
                </div>
                <CardTitle>Backend Developer</CardTitle>
                <CardDescription>RESTful API, PostgreSQL, Prisma ORM, JWT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-4">
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Xây dựng lại API cho app mẫu</p>
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Phân quyền Admin / User / UserPro</p>
                <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shrink-0" />Docker & CI/CD pipeline tự động</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* The Differentiator Banner */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="max-w-xl space-y-4">
          <Badge className="bg-primary text-primary-foreground text-xs">Điểm khác biệt</Badge>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">
            1 dự án mẫu — dùng cho cả Tester, Backend, Docker & CI/CD
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: Bug, text: 'Tester: tìm lỗi, lập tài liệu' },
              { icon: Layers, text: 'Backend: code API theo spec' },
              { icon: Cpu, text: 'Docker: Dockerfile & Compose' },
              { icon: GraduationCap, text: 'CI/CD: pipeline chạy test tự động' },
              { icon: FileCode, text: 'Frontend: đủ dùng cho Tester/BE' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 p-2 rounded-md bg-muted/60">
                <Icon className="size-3.5 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
