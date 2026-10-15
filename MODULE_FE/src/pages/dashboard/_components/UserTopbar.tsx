import { useAppSelector, useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Menu, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface UserTopbarProps {
  onToggleMobileMenu?: () => void;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserTopbar({ onToggleMobileMenu }: UserTopbarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 sm:gap-4 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6">
      {onToggleMobileMenu && (
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Breadcrumb navigation */}
      <AppBreadcrumb className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {user?.isContributor && (
          <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-semibold gap-1 border-primary/30 text-primary">
            <Sparkles className="size-3" /> Contributor
          </Badge>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="User menu"
            >
              <Avatar className="size-8 border border-border">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Learner'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || user?.phone}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/user/dashboard/profile" className="flex items-center gap-2 text-xs cursor-pointer">
                <User className="size-3.5" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
