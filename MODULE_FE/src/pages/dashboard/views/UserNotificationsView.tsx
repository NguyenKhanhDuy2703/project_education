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
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/stores/store';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import type { NotificationRecord } from '@/features/notifications/types/notifications.types';

function formatTimestamp(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoStr;
  }
}

function getTypeBadge(type: string) {
  if (type.startsWith('UPGRADE_') || type.startsWith('MEMBERSHIP_') || type.startsWith('PAYMENT_') || type === 'BILLING') {
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
        <CreditCard className="size-3" />
        <span>Gói Pro</span>
      </Badge>
    );
  }
  if (type.startsWith('CONTENT_REVIEW_') || type === 'REVIEW_FEEDBACK') {
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 bg-blue-500/10 gap-1">
        <CheckCircle2 className="size-3" />
        <span>Kiểm duyệt</span>
      </Badge>
    );
  }
  if (type === 'ANNOUNCEMENT') {
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-500/30 bg-indigo-500/10 gap-1">
        <Megaphone className="size-3" />
        <span>Thông báo</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border bg-muted/40 gap-1">
      <Info className="size-3" />
      <span>Hệ thống</span>
    </Badge>
  );
}

export function UserNotificationsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-list', user?.id, activeTab],
    queryFn: () =>
      notificationsApi.getMyNotifications({
        unreadOnly: activeTab === 'unread',
        limit: 30,
      }),
    enabled: Boolean(user?.id),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list', user?.id] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list', user?.id] });
    },
  });

  const handleAction = (item: NotificationRecord) => {
    if (!item.readAt) {
      markAsReadMutation.mutate(item.id);
    }
    if (item.actionPath && item.actionPath.startsWith('/') && !item.actionPath.startsWith('//')) {
      navigate(item.actionPath);
    }
  };

  const notifications = data?.items ?? [];
  const totalUnread = data?.totalUnread ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-6 text-primary" />
            <span>Hộp thư thông báo</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi trạng thái nâng cấp Pro, kết quả kiểm duyệt nội dung và các thông báo mới nhất.
          </p>
        </div>

        {totalUnread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>Đánh dấu đã đọc tất cả</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'all' | 'unread')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-64 grid-cols-2">
            <TabsTrigger value="all" className="text-xs">
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs gap-1.5">
              <span>Chưa đọc</span>
              {totalUnread > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 font-bold">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">Không thể tải thông báo</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Thử lại
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card">
          <Bell className="size-10 mx-auto text-muted-foreground/30 stroke-1" />
          <p className="text-sm font-semibold text-foreground">
            {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Khi có thông báo hệ thống, nâng cấp gói dịch vụ hoặc thông báo kiểm duyệt, chúng sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'border-primary/30 bg-primary/5 shadow-xs'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(item.type)}
                    <h2 className={`text-sm ${isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
                      {item.title}
                    </h2>
                    {isUnread && (
                      <span className="size-2 rounded-full bg-primary shrink-0" title="Chưa đọc" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatTimestamp(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                  {item.body}
                </p>

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                  <div>
                    {item.actionPath && item.actionPath.startsWith('/') && !item.actionPath.startsWith('//') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAction(item)}
                        className="h-7 text-xs text-primary font-semibold gap-1 px-2 -ml-2"
                      >
                        <span>Truy cập</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    )}
                  </div>

                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(item.id)}
                      disabled={markAsReadMutation.isPending}
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                    >
                      <Check className="size-3" />
                      <span>Đánh dấu đã đọc</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
