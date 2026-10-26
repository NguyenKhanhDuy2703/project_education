import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAdminApi } from '@/features/notifications/api/notifications.admin.api';
import type {
  AnnouncementRecord,
  AnnouncementAudience,
} from '@/features/notifications/types/notifications.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  XCircle,
  ExternalLink,
} from 'lucide-react';

function getAudienceBadge(aud: AnnouncementAudience) {
  switch (aud) {
    case 'PRO_ONLY':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30 bg-amber-500/10">
          Chỉ thành viên Pro
        </Badge>
      );
    case 'FREE_ONLY':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 bg-blue-500/10">
          Chỉ người dùng Free
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-foreground border-border bg-muted/40">
          Toàn bộ người dùng
        </Badge>
      );
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1">
          <CheckCircle2 className="size-3" />
          <span>Hoàn tất</span>
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-sky-600 border-sky-500/30 bg-sky-500/10 gap-1 animate-pulse">
          <Loader2 className="size-3 animate-spin" />
          <span>Đang gửi...</span>
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-500/30 bg-rose-500/10 gap-1">
          <XCircle className="size-3" />
          <span>Lỗi</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
          <Clock className="size-3" />
          <span>Chờ xử lý</span>
        </Badge>
      );
  }
}

export function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'ALL' as AnnouncementAudience,
    actionPath: '',
  });

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const { data: announcements = [], isLoading } = useQuery<AnnouncementRecord[]>({
    queryKey: ['admin-announcements'],
    queryFn: notificationsAdminApi.getAnnouncements,
    refetchInterval: (query) => {
      const items = query.state.data;
      const isProcessing = items?.some((a) => a.status === 'PROCESSING' || a.status === 'PENDING');
      return isProcessing ? 3000 : 30000;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const cleanPath = form.actionPath.trim();
      return notificationsAdminApi.createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        actionPath: cleanPath || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      showFeedback('Thông báo đã được tạo và đưa vào hàng đợi gửi tin.');
      setConfirmOpen(false);
      setForm({
        title: '',
        body: '',
        audience: 'ALL',
        actionPath: '',
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể tạo thông báo';
      showFeedback(msg, 'error');
    },
  });

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    if (form.actionPath.trim() && !form.actionPath.trim().startsWith('/')) {
      showFeedback('Đường dẫn hành động (Action Path) phải bắt đầu bằng "/" (đường dẫn nội bộ)', 'error');
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Megaphone className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Announcements & Broadcasts
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gửi thông báo in-app đến toàn bộ người dùng hoặc phân khúc học viên theo gói cước.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer Form */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Send className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Soạn thông báo mới</h2>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Tiêu đề thông báo *</label>
              <Input
                required
                maxLength={120}
                placeholder="Ví dụ: Cập nhật lộ trình học SQL Pro tháng 11"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-muted-foreground block text-right">{form.title.length}/120</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Nội dung chi tiết *</label>
              <Textarea
                required
                rows={5}
                maxLength={2000}
                placeholder="Nhập nội dung thông báo gửi đến học viên..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="text-xs"
              />
              <span className="text-[10px] text-muted-foreground block text-right">{form.body.length}/2000</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Đối tượng người nhận *</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}
                className="w-full h-9 text-xs px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Toàn bộ học viên (All Active Users)</option>
                <option value="PRO_ONLY">Chỉ học viên gói Pro (Pro Subscribers Only)</option>
                <option value="FREE_ONLY">Chỉ học viên miễn phí (Free Tier Only)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Đường dẫn hành động (Action Path)</label>
              <Input
                placeholder="Ví dụ: /series hoặc /pricing"
                value={form.actionPath}
                onChange={(e) => setForm({ ...form, actionPath: e.target.value })}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Tùy chọn. Phải là đường dẫn nội bộ bắt đầu bằng dấu <code className="bg-muted px-1 rounded">/</code>.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!form.title.trim() || !form.body.trim() || createMutation.isPending}
              className="w-full font-bold text-xs gap-1.5"
            >
              <Send className="size-3.5" />
              <span>Xem lại & Gửi thông báo</span>
            </Button>
          </form>
        </div>

        {/* Right Column: Progress & Past Announcements */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Lịch sử & Tiến độ gửi tin</h2>
            <span className="text-xs text-muted-foreground">{announcements.length} thông báo</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-xs">Đang tải lịch sử thông báo...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2 bg-card">
              <Megaphone className="size-8 mx-auto text-muted-foreground/30 stroke-1" />
              <p className="text-xs font-semibold text-foreground">Chưa có thông báo nào được phát</p>
              <p className="text-[11px] text-muted-foreground">
                Sử dụng biểu mẫu bên trái để soạn và gửi bản tin đầu tiên.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((item) => {
                const total = item.totalRecipients || 0;
                const sent = item.processedRecipients ?? item.sentRecipients ?? 0;
                const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((sent / total) * 100))) : 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getAudienceBadge(item.audience)}
                          {getStatusBadge(item.status)}
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{item.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                      {item.body}
                    </p>

                    {item.actionPath && (
                      <div className="flex items-center gap-1 text-[11px] text-primary font-mono">
                        <ExternalLink className="size-3" />
                        <span>{item.actionPath}</span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="pt-2 border-t border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Tiến độ gửi: <strong className="text-foreground">{sent}</strong> / {total} người nhận
                        </span>
                        <span className="font-bold text-foreground">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2 rounded-full" />
                      {item.failedRecipients > 0 && (
                        <span className="text-[10px] text-rose-500 font-semibold block">
                          Có {item.failedRecipients} người nhận gửi thất bại.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CONFIRM AUDIENCE MODAL ───────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Users className="size-5" />
              <span>Xác nhận phát thông báo hàng loạt</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vui lòng kiểm tra kỹ nội dung trước khi gửi. Thông báo sẽ được đưa vào hàng đợi và gửi đến toàn bộ người nhận đã chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đối tượng:</span>
                <div>{getAudienceBadge(form.audience)}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Tiêu đề:</span>
                <span className="font-bold text-foreground">{form.title}</span>
              </div>
              {form.actionPath && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đường dẫn:</span>
                  <span className="font-mono text-primary">{form.actionPath}</span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px]">
              Lưu ý: Hành động này không thể hoàn tác sau khi đã bắt đầu phát tin.
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="text-xs font-bold gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Xác nhận gửi thông báo</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
