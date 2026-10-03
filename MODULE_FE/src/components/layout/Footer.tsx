import { Link } from 'react-router-dom';
import { BookOpen, Mail, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      {/* Top accent strip */}
      <div className="border-b border-border bg-accent/20 py-3">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span>Điểm khác biệt: <strong>1 dự án mẫu xuyên suốt</strong> kết nối tất cả môn học.</span>
          </div>
          <Link to="/sample-project" className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Xem dự án <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* Main links */}
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <BookOpen className="size-4" />
              </div>
              <span className="font-bold text-foreground">StudyIT<span className="text-primary">.dev</span></span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lộ trình IT thực chiến cho Tester & Backend. Thực hành qua dự án mẫu.
            </p>
            <div className="flex gap-2 pt-1">
              <SocialIcon href="https://github.com" label="GitHub">
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://facebook.com" label="Facebook">
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="mailto:contact@studyit.dev" label="Email">
                <Mail className="size-3.5" />
              </SocialIcon>
            </div>
          </div>

          {/* Khóa học */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Khóa học</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <FooterLink to="/courses/tester">Lộ trình Tester</FooterLink>
              <FooterLink to="/courses/backend">Lộ trình Backend</FooterLink>
              <FooterLink to="/courses/istqb">Luyện thi ISTQB</FooterLink>
              <FooterLink to="/courses/docker-ci-cd">Docker & CI/CD</FooterLink>
              <FooterLink to="/courses/frontend">Frontend (thiết yếu)</FooterLink>
            </ul>
          </div>

          {/* Thực hành */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Thực hành</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <FooterLink to="/sample-project">🔥 Dự án mẫu xuyên suốt</FooterLink>
              <FooterLink to="/practice/swagger">Swagger API & Mock Data</FooterLink>
              <FooterLink to="/practice/exercises">Bài tập có đáp án</FooterLink>
              <FooterLink to="/practice/quiz">Câu hỏi trắc nghiệm</FooterLink>
              <FooterLink to="/resources">Template Repo</FooterLink>
            </ul>
          </div>

          {/* Về nền tảng */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Về chúng tôi</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <FooterLink to="/about">Giới thiệu</FooterLink>
              <FooterLink to="/contribute">Dành cho Editor</FooterLink>
              <FooterLink to="/faq">Câu hỏi thường gặp</FooterLink>
              <FooterLink to="/contact">Liên hệ</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} StudyIT.dev · Made with <Heart className="size-3 text-destructive fill-destructive" /> for IT community
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Điều khoản</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="hover:text-primary transition-colors">
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      aria-label={label}
      className="size-7 flex items-center justify-center rounded-md border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
    >
      {children}
    </a>
  );
}
