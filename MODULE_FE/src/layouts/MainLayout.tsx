import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { UserSidebar } from '@/pages/dashboard/_components/UserSidebar';
import { useSidebarCollapse } from '@/pages/dashboard/hooks/useSidebarCollapse';
import { TooltipProvider } from '@/components/ui/tooltip';

export function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { collapsed, toggleCollapse } = useSidebarCollapse();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <div className="flex-1 flex min-w-0 relative">
          {isAuthenticated && (
            <UserSidebar
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              mobileOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          )}

          <div
            className={`flex flex-col flex-1 min-w-0 ml-0 ${
              isAuthenticated ? (collapsed ? 'md:ml-16' : 'md:ml-60') : ''
            } transition-all duration-200 ease-in-out`}
          >
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
          </div>
        </div>
        <FeedbackWidget />
      </div>
    </TooltipProvider>
  );
}
