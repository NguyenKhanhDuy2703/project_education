import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserSidebar } from '@/pages/dashboard/_components/UserSidebar';
import { UserTopbar } from '@/pages/dashboard/_components/UserTopbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { CreateContentDialog } from '@/pages/contributor/_components/CreateContentDialog';

/**
 * UserDashboardLayout — Dedicated unified dashboard layout for Learners & Contributors.
 * Replaces separate ContributorLayout with a cohesive pure-navigation sidebar.
 */
export function UserDashboardLayout() {
  const location = useLocation();
  const isStudioRoute = location.pathname.includes('/labs/') && (location.pathname.includes('/edit') || location.pathname.includes('/new'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Pure Navigation Left Sidebar (Desktop fixed + Mobile drawer) */}
        <UserSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main area: offset by sidebar width on desktop */}
        <div
          className={`flex flex-col flex-1 min-w-0 ml-0 ${
            collapsed ? 'md:ml-16' : 'md:ml-60'
          } transition-all duration-200`}
        >
          {/* Sticky Topbar with breadcrumb & mobile hamburger trigger */}
          <UserTopbar
            onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          />

          {/* Scrollable page content */}
          <main className={`flex-1 overflow-auto ${isStudioRoute ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
            <Outlet />
          </main>
        </div>

        {/* Global Create Content Dialog Modal for Contributors */}
        <CreateContentDialog />
        <FeedbackWidget />
      </div>
    </TooltipProvider>
  );
}
