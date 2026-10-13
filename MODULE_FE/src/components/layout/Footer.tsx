import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm text-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <BookOpen className="size-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            StudyIT<span className="text-primary">.dev</span>
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — Interactive developer practice series platform
          </span>
        </div>

        {/* Right: Copyright & Policies */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} StudyIT.dev</span>
          <span>·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
