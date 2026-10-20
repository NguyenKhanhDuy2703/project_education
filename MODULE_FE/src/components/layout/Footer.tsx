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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-8 border-b border-border/50">
          {/* Column 1: Brand & Value Statement */}
          <div className="space-y-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <BookOpen className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">
                StudyIT<span className="text-primary">.dev</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Column 2: Learn Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('footer.learn')}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  to="/series"
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {t('footer.seriesCatalog')}
                </Link>
              </li>
              <li>
                <Link
                  to="/series?tab=labs"
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {t('footer.practiceLabs')}
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard"
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
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
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <button
                  type="button"
                  onClick={handleOpenFeedback}
                  className="hover:text-foreground transition-colors text-left focus-visible:outline-none focus-visible:underline cursor-pointer"
                >
                  {t('footer.feedback')}
                </button>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Dynamic Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>{t('footer.copyright', { year: currentYear })}</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t('footer.terms')}
            </Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
