import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/pages/admin/_components/AdminSidebar';
import { AdminTopbar } from '@/pages/admin/_components/AdminTopbar';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * AdminLayout — completely separate from the public website MainLayout.
 * No shared Navbar or Footer. Renders a fixed left sidebar + sticky topbar + scrollable content area.
 */
export function AdminLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Fixed Left Sidebar */}
        <AdminSidebar />

        {/* Main area: offset by sidebar width */}
        <div className="flex flex-col flex-1 min-w-0 ml-60">
          {/* Sticky Topbar with breadcrumb */}
          <AdminTopbar />

          {/* Scrollable page content */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
