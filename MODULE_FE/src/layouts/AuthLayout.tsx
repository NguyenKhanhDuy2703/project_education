import { Outlet, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background px-4 py-6">
      {/* Decorative blobs */}
      <div
        className="absolute -top-32 -left-36 size-[500px] rounded-full pointer-events-none opacity-40 blur-[80px]"
        style={{ background: 'radial-gradient(circle, oklch(65% 0.18 240 / 0.4), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 size-[420px] rounded-full pointer-events-none opacity-30 blur-[80px]"
        style={{ background: 'radial-gradient(circle, oklch(70% 0.14 200 / 0.35), transparent 70%)' }}
      />

      {/* Centered wrapper */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col gap-3">

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 px-8 py-7">

          {/* Card header: brand + back link */}
          <div className="flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div>
                <span className="text-[1.05rem] font-bold tracking-tight text-foreground leading-tight">
                  StudyIT<span className="text-primary">.dev</span>
                </span>
                <p className="text-[0.7rem] text-muted-foreground leading-snug">
                  Tester · Backend · Docker · CI/CD
                </p>
              </div>
            </div>

            {/* Back link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="size-3.5" />
              Home
            </Link>
          </div>

          {/* Divider — negative margin to bleed to card edges */}
          <div className="h-px bg-border my-5 -mx-8" />

          {/* Form */}
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-[0.68rem] text-muted-foreground">
          © 2025 StudyIT.dev · Hands-on IT Learning
        </p>
      </div>
    </div>
  );
}
