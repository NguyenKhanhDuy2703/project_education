import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Terminal,
  PenTool,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
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
  { id: 'feature_request', label: 'Góp ý tính năng', icon: Lightbulb },
  { id: 'content_lab', label: 'Nội dung bài tập', icon: BookOpen },
  { id: 'other', label: 'Khác', icon: HelpCircle },
];

interface SystemFeature {
  id: string;
  shortName: string;
  fullName: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestions: string[];
}

const SYSTEM_FEATURES: SystemFeature[] = [
  {
    id: 'series_catalog',
    shortName: 'Series & Lộ trình',
    fullName: 'Khám phá Series & Lộ trình học',
    icon: BookOpen,
    suggestions: [
      'Không tải được danh sách bài tập trong series',
      'Lộ trình hiển thị sai thứ tự bài học',
      'Đề bài bị lỗi hiển thị cú pháp Markdown / hình ảnh',
    ],
  },
  {
    id: 'lab_workspace',
    shortName: 'Thực hành Lab',
    fullName: 'Không gian Thực hành Lab Workspace',
    icon: Code2,
    suggestions: [
      'Trình soạn thảo Monaco Editor bị lag hoặc mất nét',
      'Không lưu được bài code khi bấm Submit',
      'Cây thư mục file tree không cập nhật tệp tin',
    ],
  },
  {
    id: 'code_runner',
    shortName: 'Chạy Code & Sandbox',
    fullName: 'Trình chạy Code & Docker Sandbox',
    icon: Terminal,
    suggestions: [
      'Chạy code bị timeout (vượt quá thời gian chờ)',
      'Kết quả test case không khớp với kết quả thực tế',
      'Lỗi khởi động môi trường Docker container',
    ],
  },
  {
    id: 'contributor_studio',
    shortName: 'Studio Tác giả',
    fullName: 'Studio Soạn thảo Bài tập & Series',
    icon: PenTool,
    suggestions: [
      'Không lưu được bản nháp bài lab mới',
      'Lỗi upload hình ảnh minh họa bài tập',
      'Trình kiểm thử test case mẫu báo lỗi không rõ nguyên nhân',
    ],
  },
  {
    id: 'dashboard_progress',
    shortName: 'Tiến độ & Bài nộp',
    fullName: 'Bảng điều khiển & Lịch sử nộp bài',
    icon: LayoutDashboard,
    suggestions: [
      'Lịch sử nộp bài hiển thị sai trạng thái Passed/Failed',
      'Biểu đồ thống kê học tập (streak) không cập nhật',
      'Điểm kinh nghiệm (XP) tính chưa chính xác',
    ],
  },
  {
    id: 'auth_account',
    shortName: 'Tài khoản & Đăng nhập',
    fullName: 'Tài khoản, Xác thực & Cài đặt',
    icon: ShieldCheck,
    suggestions: [
      'Gặp sự cố khi đăng nhập bằng tài khoản Google',
      'Không cập nhật được thông tin cá nhân hoặc mật khẩu',
      'Phiên đăng nhập bị hết hạn đột ngột',
    ],
  },
];

export function FeedbackWidget() {
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeFeature = SYSTEM_FEATURES.find((f) => f.id === selectedFeatureId);

  const resetForm = () => {
    setMessage('');
    setEmail('');
    setCategory('bug');
    setSelectedFeatureId(null);
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

  const handleToggleFeature = (featureId: string) => {
    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(null);
    } else {
      setSelectedFeatureId(featureId);
    }
  };

  const handleApplySuggestion = (text: string) => {
    if (!message.trim()) {
      setMessage(text);
    } else if (!message.includes(text)) {
      setMessage((prev) => `${prev.trim()}\n- ${text}`);
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

    // Embed selected system feature into message header for clear tracking
    const finalMessage = activeFeature
      ? `[Tính năng: ${activeFeature.shortName}] ${trimmedMsg}`
      : trimmedMsg;

    setIsSubmitting(true);
    try {
      await feedbackApi.create({
        category,
        message: finalMessage,
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

      <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
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
                Hãy cho chúng tôi biết trải nghiệm của bạn hoặc những tính năng cần khắc phục, cải thiện.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Category Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Phân loại yêu cầu
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
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

              {/* System Features Quick Selector */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    Chức năng liên quan (Chọn nhanh)
                  </label>
                  {activeFeature && (
                    <button
                      type="button"
                      onClick={() => setSelectedFeatureId(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SYSTEM_FEATURES.map((feat) => {
                    const isSelected = selectedFeatureId === feat.id;
                    const Icon = feat.icon;
                    return (
                      <button
                        key={feat.id}
                        type="button"
                        onClick={() => handleToggleFeature(feat.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-semibold shadow-xs'
                            : 'bg-card border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{feat.shortName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Contextual Quick Suggestion Chips */}
                {activeFeature && (
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Gợi ý nội dung thường gặp cho {activeFeature.shortName}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFeature.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplySuggestion(sug)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-primary/10 hover:text-primary border border-border transition-colors text-left text-foreground/80 cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                <label htmlFor="feedback-msg" className="text-xs font-semibold text-foreground flex justify-between">
                  <span>
                    Nội dung phản hồi <span className="text-destructive">*</span>
                  </span>
                  <span className="text-muted-foreground font-normal text-[11px]">
                    {message.length}/2000
                  </span>
                </label>
                <Textarea
                  id="feedback-msg"
                  rows={4}
                  required
                  maxLength={2000}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải, hoặc chọn các gợi ý nhanh phía trên..."
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
                  className="w-full font-medium h-9 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang gửi phản hồi...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Gửi phản hồi
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
