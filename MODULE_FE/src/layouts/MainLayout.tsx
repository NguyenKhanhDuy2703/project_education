import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

export function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      {!isHome && (
        <div className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 py-2.5">
            <AppBreadcrumb />
          </div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FeedbackWidget />
    </div>
  );
}
