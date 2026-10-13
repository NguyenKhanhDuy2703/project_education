import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Layers,
  Code2,
  FolderTree,
  PlusCircle,
  MessageSquareQuote,
  CheckCircle2,
  BookOpen,
  LogOut,
  ExternalLink,
  PenTool,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/contributor', icon: LayoutDashboard },
  { label: 'Topics', href: '/contributor/topics', icon: FolderTree },
  { label: 'Series', href: '/contributor/series', icon: Layers },
  { label: 'My Labs', href: '/contributor/labs', icon: Code2 },
  { label: 'Create Content', href: '/contributor/create', icon: PlusCircle },
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const renderNavLinks = () => (
    <nav className="px-2 space-y-0.5">
      <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Authoring Workspace
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/contributor'
            ? location.pathname === '/contributor'
            : location.pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Desktop Fixed Left Sidebar */}
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-60 flex-col border-r border-border bg-card">
          {/* Brand */}
          <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border shrink-0">
            <div className="flex items-center justify-center size-7 rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-foreground">StudyIT</span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <PenTool className="size-2.5" />
                Contributor Studio
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <ScrollArea className="flex-1 py-3">
            {renderNavLinks()}
          </ScrollArea>

          {/* User profile & actions */}
          <div className="p-3 border-t border-border bg-muted/10 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="size-7">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 uppercase font-sans font-semibold">
                    Contributor
                  </Badge>
                </div>
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

            <div className="mt-2.5 pt-2 border-t border-border/40">
              <Link
                to="/"
                className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-primary transition-colors py-0.5"
              >
                <span>Back to Home</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-64 bg-card h-full flex flex-col border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex h-14 items-center justify-between px-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span className="text-sm font-bold">Contributor Studio</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <ScrollArea className="flex-1 py-3">
                {renderNavLinks()}
              </ScrollArea>

              <div className="p-3 border-t border-border bg-muted/10 space-y-2">
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
        <div className="flex flex-col flex-1 min-w-0 ml-0 md:ml-60">
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
              <Link to="/contributor/create">
                <Button size="sm" className="h-8 text-xs font-semibold gap-1.5">
                  <PlusCircle className="size-3.5" />
                  New Content
                </Button>
              </Link>
            </div>
          </header>

          {/* Main content view */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
