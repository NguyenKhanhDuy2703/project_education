import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/stores/store';
import { setUser } from '@/stores/slices/auth.slice';
import { authApi } from '@/features/auth/api/auth.api';
import { Navbar } from '@/components/layout/Navbar';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import { UserSidebar } from '@/pages/dashboard/_components/UserSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { CreateContentDialog } from '@/pages/contributor/_components/CreateContentDialog';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
import { useSidebarCollapse } from '@/pages/dashboard/hooks/useSidebarCollapse';

/**
 * UserDashboardLayout — Dedicated unified dashboard layout for Learners & Contributors.
 * Synchronized with the global website Navbar for cohesive header design.
 * Fixed width sidebar: w-16 (64px) collapsed, w-60 (240px) expanded.
 */
export function UserDashboardLayout() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isStudioRoute = location.pathname.includes('/labs/') && (location.pathname.includes('/edit') || location.pathname.includes('/new'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { collapsed, toggleCollapse } = useSidebarCollapse();

  // Automatically sync fresh user profile and permissions from server once on mount
  useEffect(() => {
    authApi
      .getCurrentUser()
      .then((freshUser) => {
        if (freshUser) {
          dispatch(setUser(freshUser));
        }
      })
      .catch(() => {
        // Silently keep cached credentials on network issue
      });
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Synchronized Global Website Navbar */}
        <Navbar />

        <div className="flex-1 flex min-w-0 relative">
          {/* Pure Navigation Left Sidebar (Fixed width w-16 collapsed, w-60 expanded) */}
          <UserSidebar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            mobileOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* Main content area with fixed-width margin */}
          <div
            className={`flex flex-col flex-1 min-w-0 ml-0 ${
              collapsed ? 'md:ml-16' : 'md:ml-60'
            } transition-all duration-200 ease-in-out min-h-[calc(100vh-4rem)]`}
          >
            {/* Mobile sub-bar for sidebar navigation & breadcrumb */}
            <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <PanelLeft className="size-4" />
                <span>Menu</span>
              </Button>
              <AppBreadcrumb className="flex-1 text-xs" />
            </div>

            {/* Desktop breadcrumb bar */}
            <div className="hidden md:flex items-center px-6 py-2.5 border-b border-border/40 bg-muted/10">
              <AppBreadcrumb className="flex-1 text-xs" />
            </div>

            {/* Scrollable page content */}
            <main className={`flex-1 overflow-auto ${isStudioRoute ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
              {isStudioRoute ? (
                <Outlet />
              ) : (
                <div className="max-w-6xl mx-auto w-full">
                  <Outlet />
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Global Create Content Dialog Modal for Contributors */}
        <CreateContentDialog />
        <FeedbackWidget />
      </div>
    </TooltipProvider>
  );
}
