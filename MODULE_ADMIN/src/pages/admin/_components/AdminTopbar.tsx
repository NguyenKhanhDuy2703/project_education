import { useAppSelector } from '@/stores/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';

interface AdminTopbarProps {
  onToggleMobileMenu?: () => void;
}

function getInitials(name?: string) {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminTopbar({ onToggleMobileMenu }: AdminTopbarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 sm:gap-4 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6">
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
      {/* Breadcrumb */}
      <AppBreadcrumb className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted outline-none transition-colors">
              <Avatar className="size-7 border border-border">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'Admin'} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-foreground">{user?.name || 'Admin'}</span>
                <span className="text-[10px] text-muted-foreground">Administrator</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/user/dashboard')}>
              <User className="size-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
