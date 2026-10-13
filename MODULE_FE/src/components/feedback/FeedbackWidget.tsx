import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquarePlus,
  Bug,
  Sparkles,
  BookOpen,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/stores/store';
import { feedbackApi, type FeedbackCategory } from '@/features/feedback/api/feedback.api';

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'bug', label: 'Báo lỗi', icon: Bug },
  { id: 'feature_request', label: 'Góp ý tính năng', icon: Sparkles },
  { id: 'content_lab', label: 'Nội dung bài tập', icon: BookOpen },
  { id: 'other', label: 'Khác', icon: HelpCircle },
];

export function FeedbackWidget() {
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setMessage('');
    setEmail('');
    setCategory('bug');
    setErrorMsg(null);
    setIsSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        resetForm();
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 5) {
      setErrorMsg('Vui lòng nhập nội dung phản hồi tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackApi.create({
        category,
        message: trimmedMsg,
        email: !isAuthenticated && email.trim() ? email.trim() : undefined,
        pageUrl: location.pathname + location.search,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        'Không thể gửi phản hồi lúc này. Vui lòng thử lại sau.';
      setErrorMsg(Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="icon"
          aria-label="Gửi phản hồi & Góp ý"
          className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
        >
          <MessageSquarePlus className="size-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Cảm ơn bạn đã gửi phản hồi!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Ý kiến đóng góp của bạn đã được ghi nhận và giúp chúng tôi cải thiện nền tảng tốt hơn.
              </DialogDescription>
            </div>
            <div className="pt-2 flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border"
                onClick={() => resetForm()}
              >
                Gửi phản hồi khác
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Gửi phản hồi & Góp ý
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hãy cho chúng tôi biết trải nghiệm của bạn hoặc những điều cần cải thiện.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Category Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Phân loại
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <IconComponent className="size-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Identity or Guest Email */}
              {isAuthenticated && user ? (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>Gửi với tư cách:</span>
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {user.name || user.email}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="feedback-email" className="text-xs font-medium text-foreground">
                    Email liên hệ{' '}
                    <span className="text-muted-foreground font-normal">(không bắt buộc)</span>
                  </label>
                  <Input
                    id="feedback-email"
                    type="email"
                    placeholder="name@example.com (để nhận phản hồi)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              {/* Feedback Message */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-msg" className="text-xs font-medium text-foreground flex justify-between">
                  <span>Nội dung phản hồi <span className="text-destructive">*</span></span>
                  <span className="text-muted-foreground font-normal text-[11px]">
                    {message.length}/2000
                  </span>
                </label>
                <Textarea
                  id="feedback-msg"
                  rows={4}
                  required
                  maxLength={2000}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải hoặc ý tưởng của bạn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSubmitting}
                  className="w-full font-medium h-9"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-2" />
                      Gửi feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
