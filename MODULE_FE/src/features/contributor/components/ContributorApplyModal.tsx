import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { contributorApplicationApi } from '../api/contributor-application.api';

interface ContributorApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContributorApplyModal({ open, onOpenChange }: ContributorApplyModalProps) {
  const queryClient = useQueryClient();

  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sampleTopic, setSampleTopic] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contributor-my-application'],
    queryFn: () => contributorApplicationApi.getMyApplication(),
    enabled: open,
  });

  const existingApp = data?.application;

  useEffect(() => {
    if (existingApp && existingApp.status === 'REJECTED') {
      setBio(existingApp.bio);
      setPortfolioUrl(existingApp.portfolioUrl || '');
      setSampleTopic(existingApp.sampleTopic);
    }
  }, [existingApp]);

  const applyMutation = useMutation({
    mutationFn: contributorApplicationApi.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributor-my-application'] });
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (bio.trim().length < 20) {
      setFormError('Phần giới thiệu bản thân cần tối thiểu 20 ký tự.');
      return;
    }
    if (sampleTopic.trim().length < 10) {
      setFormError('Ý tưởng chuyên đề / bài thực hành cần tối thiểu 10 ký tự.');
      return;
    }

    applyMutation.mutate({
      bio: bio.trim(),
      portfolioUrl: portfolioUrl.trim() || undefined,
      sampleTopic: sampleTopic.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="size-5" />
            <DialogTitle className="text-xl">Đăng Ký Quyền Contributor</DialogTitle>
          </div>
          <DialogDescription>
            Đóng góp chuyên đề và bài lab tương tác để chia sẻ kiến thức cùng cộng đồng học viên StudyIT.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Đang tải dữ liệu hồ sơ...
          </div>
        ) : existingApp && existingApp.status === 'PENDING' ? (
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
              <Clock className="size-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Hồ sơ của bạn đang được xét duyệt</p>
                <p className="text-xs text-muted-foreground">
                  Ban quản trị đang xem xét thông tin và kinh nghiệm chuyên môn của bạn. Kết quả sẽ được cập nhật tại đây.
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3 text-xs space-y-2 bg-muted/30">
              <div>
                <span className="font-semibold text-foreground">Ngày nộp: </span>
                <span className="text-muted-foreground">
                  {new Date(existingApp.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Ý tưởng đề xuất: </span>
                <p className="text-muted-foreground mt-0.5 line-clamp-3">{existingApp.sampleTopic}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        ) : existingApp && existingApp.status === 'APPROVED' ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-base">Bạn đã là Contributor chính thức!</p>
              <p className="text-xs text-muted-foreground">
                Bạn có thể mở Contributor Studio trên thanh menu để bắt đầu soạn thảo nội dung.
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => onOpenChange(false)}>Bắt đầu sáng tạo</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {existingApp && existingApp.status === 'REJECTED' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="size-4" />
                  <span>Hồ sơ trước đó cần hoàn thiện thêm</span>
                </div>
                {existingApp.adminNote && (
                  <p className="text-muted-foreground pl-5">Ghi chú từ Admin: {existingApp.adminNote}</p>
                )}
                <p className="text-muted-foreground pl-5">Bạn có thể cập nhật lại thông tin và gửi lại đơn.</p>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Giới thiệu chuyên môn &amp; Kinh nghiệm <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="VD: Kỹ sư kiểm thử 4 năm kinh nghiệm với Playwright, CI/CD, Jest..."
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">Tối thiểu 20 ký tự.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Link Portfolio / Github / LinkedIn
              </label>
              <Input
                type="url"
                placeholder="https://github.com/your-username"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ý tưởng Series hoặc Lab dự kiến đóng góp <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="VD: Lộ trình thực hành kiểm thử API tự động từ cơ bản đến nâng cao..."
                rows={3}
                value={sampleTopic}
                onChange={(e) => setSampleTopic(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">Tối thiểu 10 ký tự.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={applyMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {applyMutation.isPending ? 'Đang gửi...' : 'Gửi đơn xét duyệt'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
