import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/pages/admin/_components/AdminSidebar';
import { AdminTopbar } from '@/pages/admin/_components/AdminTopbar';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * AdminLayout — completely separate from the public website MainLayout.
 * No shared Navbar or Footer. Renders a fixed left sidebar (desktop) / responsive drawer (mobile) + sticky topbar + scrollable content area.
 */
export function AdminLayout() {
  const location = useLocation();
  const isStudioRoute = location.pathname.includes('/admin/labs/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Left Sidebar (Desktop fixed + Mobile drawer) */}
        <AdminSidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main area: offset by sidebar width on desktop */}
        <div className="flex flex-col flex-1 min-w-0 ml-0 md:ml-60">
          {/* Sticky Topbar with breadcrumb & mobile hamburger trigger */}
          <AdminTopbar
            onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          />

          {/* Scrollable page content */}
          <main className={`flex-1 overflow-auto ${isStudioRoute ? 'p-0' : 'p-4 sm:p-6'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
