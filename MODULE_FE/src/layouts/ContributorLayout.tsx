import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Layers,
  Code2,
  PlusCircle,
  MessageSquareQuote,
  CheckCircle2,
  BookOpen,
  LogOut,
  ExternalLink,
  PenTool,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { CreateContentDialog } from '@/pages/contributor/_components/CreateContentDialog';
import { openCreateDialog } from '@/stores/slices/contributor.slice';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/contributor', icon: LayoutDashboard },
  { label: 'Series', href: '/contributor/series', icon: Layers },
  { label: 'My Labs', href: '/contributor/labs', icon: Code2 },
  { label: 'Review Feedback', href: '/contributor/feedback', icon: MessageSquareQuote },
  { label: 'Published Content', href: '/contributor/published', icon: CheckCircle2 },
];

function getInitials(name?: string) {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ContributorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const renderNavLinks = (isCollapsedMode = false) => (
    <nav className={`space-y-1 ${isCollapsedMode ? 'px-1.5' : 'px-3'}`}>
      {!isCollapsedMode && (
        <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Authoring Workspace
        </p>
      )}

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/contributor'
            ? location.pathname === '/contributor'
            : location.pathname.startsWith(item.href);

        const content = (
          <Link
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all ${
              isCollapsedMode
                ? 'justify-center size-9 mx-auto'
                : 'px-2.5 py-2 w-full'
            } ${
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            {!isCollapsedMode && <span className="truncate">{item.label}</span>}
          </Link>
        );

        if (isCollapsedMode) {
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-semibold">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.href}>{content}</div>;
      })}
    </nav>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Desktop Fixed Left Sidebar */}
        <aside
          className={`hidden md:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-border bg-card transition-all duration-200 select-none ${
            collapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Brand */}
          <div className={`flex h-14 items-center border-b border-border shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs">
                <BookOpen className="size-4" />
              </div>
              {!collapsed && (
                <div className="flex flex-col leading-none min-w-0">
                  <span className="text-sm font-bold text-foreground">StudyIT</span>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <PenTool className="size-2.5" />
                    Contributor
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={`size-7 text-muted-foreground hover:text-foreground shrink-0 ${collapsed ? 'hidden' : 'flex'}`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </div>

          {/* When collapsed: expand button */}
          {collapsed && (
            <div className="flex justify-center py-2 border-b border-border/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </div>
          )}

          {/* Quick Create Action */}
          <div className={`shrink-0 ${collapsed ? 'p-2 flex justify-center' : 'p-3 pb-2'}`}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => dispatch(openCreateDialog())}
                    size="icon"
                    className="size-9 bg-primary text-primary-foreground shadow-xs"
                  >
                    <PlusCircle className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-semibold">
                  Create Content
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => dispatch(openCreateDialog())}
                size="sm"
                className="w-full text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle className="size-3.5" />
                <span>Create Content</span>
              </Button>
            )}
          </div>

          {/* Navigation Items */}
          <ScrollArea className="flex-1 py-2">
            {renderNavLinks(collapsed)}
          </ScrollArea>

          {/* User profile & actions */}
          <div className={`border-t border-border bg-muted/10 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
            <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="size-7 border border-border shrink-0">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 uppercase font-sans font-semibold">
                      Contributor
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                title="Logout"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>

            {!collapsed && (
              <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-between text-[11px] text-destructive hover:underline transition-colors py-0.5 font-medium"
                  >
                    <span>Admin Studio</span>
                    <ExternalLink className="size-3" />
                  </Link>
                )}
                <Link
                  to="/"
                  className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-primary transition-colors py-0.5"
                >
                  <span>Back to Home</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-64 bg-card h-full flex flex-col border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex h-14 items-center justify-between px-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                    <BookOpen className="size-3.5" />
                  </div>
                  <span className="text-sm font-bold">Contributor Studio</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Quick Create in Mobile */}
              <div className="p-3 pb-1 shrink-0">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    dispatch(openCreateDialog());
                  }}
                  size="sm"
                  className="w-full text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <PlusCircle className="size-3.5" />
                  <span>Create Content</span>
                </Button>
              </div>

              <ScrollArea className="flex-1 py-2">
                {renderNavLinks(false)}
              </ScrollArea>

              <div className="p-3 border-t border-border space-y-2">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-xs text-destructive py-1 px-1 font-medium"
                  >
                    <span>Admin Studio</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-1"
                >
                  <span>Back to Home</span>
                  <ExternalLink className="size-3.5" />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-3.5" />
                  Logout
                </Button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main area offset by sidebar width on desktop */}
        <div
          className={`flex flex-col flex-1 min-w-0 ml-0 ${
            collapsed ? 'md:ml-16' : 'md:ml-60'
          } transition-all duration-200`}
        >
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-4 sm:px-6">
            <div className="flex items-center gap-2.5 text-xs">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground mr-1"
                title="Open menu"
              >
                <Menu className="size-4" />
              </button>
              <span className="text-muted-foreground hidden sm:inline">Contributor Studio</span>
              <span className="text-muted-foreground/40 hidden sm:inline">/</span>
              <span className="font-semibold text-foreground capitalize">
                {location.pathname.replace('/contributor', '').replace('/', '') || 'Overview'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-sans font-semibold px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex">
                Own Content Only
              </Badge>
              <Button
                onClick={() => dispatch(openCreateDialog())}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
              >
                <PlusCircle className="size-3.5" />
                <span>New Content</span>
              </Button>
            </div>
          </header>

          {/* Main content view */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Create Content Dialog Modal */}
      <CreateContentDialog />
    </TooltipProvider>
  );
}
