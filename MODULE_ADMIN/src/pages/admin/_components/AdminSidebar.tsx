import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ClipboardCheck,
  BookOpen,
  LogOut,
  ExternalLink,
  Shield,
  Award,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavSection {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Review Queue', href: '/admin/review', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Curriculum',
    items: [
      { label: 'Content', href: '/admin/content', icon: Layers },
    ],
  },
  {
    title: 'Access & IAM',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Contributors', href: '/admin/contributors', icon: Award },
      { label: 'Plans', href: '/admin/plans', icon: CreditCard },
      { label: 'User Groups', href: '/admin/groups', icon: Shield },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Feedback', href: '/admin/feedback', icon: MessageSquareQuote },
      { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
    ],
  },
];

function getInitials(name?: string) {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const renderNavLinks = (isCollapsedMode = false) => (
    <nav className={`space-y-4 ${isCollapsedMode ? 'px-1.5' : 'px-3'}`}>
      {NAV_SECTIONS.map((section, sIdx) => (
        <div key={section.title || sIdx} className="space-y-1">
          {section.title && !isCollapsedMode && (
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
          )}

          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);

            const content = (
              <Link
                to={item.href}
                onClick={onClose}
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
                {!isCollapsedMode && item.badge && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary-foreground">
                    {item.badge}
                  </span>
                )}
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
        </div>
      ))}
    </nav>
  );

  const renderFooter = (isCollapsedMode = false) => (
    <div className={`shrink-0 border-t border-border space-y-2 ${isCollapsedMode ? 'p-2' : 'p-3'}`}>
      {!isCollapsedMode && (
        <div className="space-y-1">
          <a
            href={window.location.hostname.includes('localhost') ? 'http://localhost:5173' : 'https://studyit.dev'}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">Back to StudyIT Web</span>
          </a>
        </div>
      )}

      {/* User profile bar */}
      <div className={`flex items-center gap-2 rounded-lg bg-muted/40 ${isCollapsedMode ? 'p-1.5 justify-center' : 'px-2.5 py-2'}`}>
        <Avatar className="size-7 border border-border shrink-0">
          <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'Admin'} />
          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>

        {!isCollapsedMode && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || user?.phone}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          title="Logout"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-border bg-card transition-all duration-200 select-none ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Header / Brand */}
        <div className={`flex h-14 items-center border-b border-border shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs">
              <BookOpen className="size-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-sm font-bold text-foreground">StudyIT</span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Shield className="size-2.5" />
                  Admin
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={`size-7 text-muted-foreground hover:text-foreground shrink-0 ${collapsed ? 'hidden' : 'flex'}`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>

        {/* When collapsed, small expand button at top */}
        {collapsed && onToggleCollapse && (
          <div className="flex justify-center py-2 border-b border-border/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          {renderNavLinks(collapsed)}
        </ScrollArea>

        {/* Footer */}
        {renderFooter(collapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-64 bg-card h-full flex flex-col border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <BookOpen className="size-3.5" />
                </div>
                <span className="text-sm font-bold">Admin Studio</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <ScrollArea className="flex-1 py-3">
              {renderNavLinks(false)}
            </ScrollArea>

            {renderFooter(false)}
          </div>
          <div className="flex-1" onClick={onClose} />
        </div>
      )}
    </>
  );
}
