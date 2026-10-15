import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
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
  User,
  BookMarked,
  CheckCircle2,
  BookOpen,
  LogOut,
  Award,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContributorApplyModal } from '@/features/contributor/components/ContributorApplyModal';

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onClick?: () => void;
}

export interface UserSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserSidebar({
  collapsed = true,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
}: UserSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const isContributor = user?.isContributor === true || user?.role === 'admin' || user?.role === 'contributor';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Single flat list — no tiering/subheadings (Account, Menu)
  const navItems: NavItem[] = [
    { label: 'Profile', href: '/user/dashboard/profile', icon: User },
    { label: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Lab Submissions', href: '/user/dashboard/submissions', icon: CheckCircle2 },
    ...(isContributor
      ? [
          { label: 'My Content', href: '/user/dashboard/content', icon: Layers },
          { label: 'Review Feedback', href: '/user/dashboard/feedback', icon: MessageSquareQuote },
        ]
      : []),
    { label: 'Saved Series', href: '/user/dashboard/saved', icon: BookMarked },
    ...(!isContributor
      ? [
          {
            label: user?.contributorStatus === 'PENDING' ? 'Application Pending' : 'Become Contributor',
            icon: Award,
            onClick: () => {
              setApplyModalOpen(true);
              if (onClose) onClose();
            },
            badge: user?.contributorStatus === 'PENDING' ? 'Pending' : undefined,
          },
        ]
      : []),
  ];

  const renderNavLinks = (isCollapsedMode = false) => (
    <nav className={`space-y-1.5 ${isCollapsedMode ? 'px-1.5' : 'px-3'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/user/dashboard'
            ? location.pathname === '/user/dashboard'
            : item.href
            ? location.pathname.startsWith(item.href)
            : false;

        const buttonContent = (
          <div
            className={`flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>
                {item.badge}
              </span>
            )}
          </div>
        );

        const content = item.href ? (
          <Link to={item.href} onClick={onClose} className="block w-full">
            {buttonContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={item.onClick}
            className="block w-full text-left"
          >
            {buttonContent}
          </button>
        );

        if (isCollapsedMode) {
          return (
            <Tooltip key={item.label} delayDuration={0}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-semibold">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.label}>{content}</div>;
      })}
    </nav>
  );

  const renderFooter = (isCollapsedMode = false) => (
    <div className={`shrink-0 border-t border-border ${isCollapsedMode ? 'p-2' : 'p-3'}`}>
      {isCollapsedMode ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center size-9 mx-auto rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-semibold">
            Log out
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
          <Avatar className="size-7 border border-border shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Learner'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || user?.phone || 'Free Plan'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar: Fixed Width (w-16 collapsed, w-60 expanded) */}
      <aside
        className={`hidden md:flex fixed top-16 bottom-0 left-0 z-40 flex-col border-r border-border bg-card transition-all duration-200 ease-in-out select-none ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Header: Menu Title & Collapse Toggle */}
        <div
          className={`flex h-12 items-center border-b border-border shrink-0 ${
            collapsed ? 'justify-center px-1' : 'justify-between px-3.5'
          }`}
        >
          {!collapsed ? (
            <>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Menu
              </span>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Thu gọn menu"
                  aria-label="Thu gọn menu"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              )}
            </>
          ) : (
            onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Mở rộng menu"
                aria-label="Mở rộng menu"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            )
          )}
        </div>

        {/* Navigation Links */}
        <ScrollArea className="flex-1 py-3">
          {renderNavLinks(collapsed)}
        </ScrollArea>

        {/* Footer */}
        {renderFooter(collapsed)}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
              <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold text-foreground">
                    StudyIT<span className="text-primary font-extrabold">.dev</span>
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                    Practice Series
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 py-3">
              {renderNavLinks(false)}
            </ScrollArea>

            {renderFooter(false)}
          </aside>
        </div>
      )}

      {/* Contributor Application Modal */}
      <ContributorApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
      />
    </>
  );
}
