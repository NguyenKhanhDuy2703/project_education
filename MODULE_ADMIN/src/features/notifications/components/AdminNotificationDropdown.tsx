import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  CreditCard,
  CheckCircle2,
  Megaphone,
  Info,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/stores/store';
import { notificationsAdminApi } from '../api/notifications.admin.api';
import type { NotificationRecord } from '../types/notifications.types';

function formatTimestamp(isoStr: string) {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

function getNotificationIcon(type: string) {
  if (type.startsWith('UPGRADE_') || type.startsWith('MEMBERSHIP_') || type.startsWith('PAYMENT_') || type === 'BILLING') {
    return <CreditCard className="size-4 text-amber-500 shrink-0" />;
  }
  if (type.startsWith('CONTENT_REVIEW_') || type === 'REVIEW_FEEDBACK') {
    return <CheckCircle2 className="size-4 text-blue-500 shrink-0" />;
  }
  if (type === 'ANNOUNCEMENT') {
    return <Megaphone className="size-4 text-indigo-500 shrink-0" />;
  }
  return <Info className="size-4 text-muted-foreground shrink-0" />;
}

export function AdminNotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const { data: unreadData } = useQuery({
    queryKey: ['admin-notifications-unread-count', user?.id],
    queryFn: notificationsAdminApi.getUnreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: inboxData, isLoading: loadingInbox } = useQuery({
    queryKey: ['admin-notifications-preview', user?.id],
    queryFn: () => notificationsAdminApi.getMyNotifications({ limit: 6 }),
    enabled: Boolean(user?.id) && open,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAdminApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-preview', user?.id] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAdminApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-preview', user?.id] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = inboxData?.items ?? [];

  const handleItemClick = (item: NotificationRecord) => {
    if (!item.readAt) {
      markAsReadMutation.mutate(item.id);
    }
    setOpen(false);
    if (item.actionPath && item.actionPath.startsWith('/') && !item.actionPath.startsWith('//')) {
      navigate(item.actionPath);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus:outline-none"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              data-testid="admin-unread-badge-count"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 bg-card border border-border shadow-xl rounded-xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Hộp thư Admin</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-bold">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              {markAllMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              <span>Đọc tất cả</span>
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
          {loadingInbox ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Đang tải thông báo...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground space-y-1">
              <Bell className="size-8 mx-auto opacity-30 stroke-1" />
              <p className="text-xs font-medium text-foreground">Không có thông báo nào</p>
              <p className="text-[11px]">Thông báo hệ thống và kiểm duyệt sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.readAt;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 text-xs flex gap-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                    isUnread ? 'bg-primary/5' : 'bg-card'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className="pt-0.5">{getNotificationIcon(item.type)}</div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate text-xs ${isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {item.title}
                      </span>
                      {isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block pt-0.5">
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
