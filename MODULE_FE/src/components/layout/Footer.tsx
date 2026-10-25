import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useI18n } from '@/features/preferences/i18n';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  const handleOpenFeedback = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-study-feedback'));
  };

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm text-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 gap-8 border-b border-border/50 pb-8 md:grid-cols-3">
          {/* Column 1: Brand & Value Statement */}
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <BookOpen className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">
                StudyIT<span className="text-primary">.dev</span>
              </span>
            </Link>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground sm:text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Column 2: Learn Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('footer.learn')}
            </h4>
            <ul className="space-y-1 text-base text-muted-foreground sm:text-sm">
              <li>
                <Link
                  to="/series"
                  className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.seriesCatalog')}
                </Link>
              </li>
              <li>
                <Link
                  to="/series?tab=labs"
                  className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.practiceLabs')}
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard"
                  className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('footer.support')}
            </h4>
            <ul className="space-y-1 text-base text-muted-foreground sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={handleOpenFeedback}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-sm text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.feedback')}
                </button>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Dynamic Copyright */}
        <div className="flex items-center justify-center pt-6 text-center text-sm text-muted-foreground">
          <span>{t('footer.copyright', { year: currentYear })}</span>
        </div>
      </div>
    </footer>
  );
}
