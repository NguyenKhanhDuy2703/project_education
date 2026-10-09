import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  FileText,
  Code2,
  BookOpen,
  LogOut,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Content', href: '/admin/content', icon: Layers },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Plans & Features', href: '/admin/plans', icon: CreditCard },
  { label: 'Audit Trail', href: '/admin/audit', icon: FileText },
];

function getInitials(name?: string) {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border shrink-0">
        <div className="flex items-center justify-center size-7 rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-foreground">StudyIT</span>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
            <Shield className="size-2.5" />
            Admin Studio
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            // Exact match for /admin, prefix match for sub-routes
            const isActive =
              item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);

            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <Separator className="my-3 mx-2" />

        <nav className="px-2 space-y-0.5">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Content Tools
          </p>
          <Link
            to="/admin/content"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === '/admin/content'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Code2 className="size-4 shrink-0" />
            <span>Labs & Blog</span>
          </Link>
        </nav>
      </ScrollArea>

      {/* Footer: User info + Back to site */}
      <div className="shrink-0 border-t border-border p-3 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3.5" />
          <span>Back to website</span>
        </Link>

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="size-7 border border-border">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'Admin'} />
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || user?.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
