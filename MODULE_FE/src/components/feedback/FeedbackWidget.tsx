import React, { useState, useEffect } from 'react';
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
import { useI18n, type TranslationKey } from '@/features/preferences/i18n';

interface CategoryOption {
  id: FeedbackCategory;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'bug', labelKey: 'feedback.categoryIssue', icon: Bug },
  { id: 'feature_request', labelKey: 'feedback.categoryFeature', icon: Lightbulb },
  { id: 'content_lab', labelKey: 'feedback.categoryContent', icon: BookOpen },
  { id: 'other', labelKey: 'feedback.categoryOther', icon: HelpCircle },
];

interface SystemFeature {
  id: string;
  nameKey: TranslationKey;
  suggestionKeys: TranslationKey[];
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_FEATURES: SystemFeature[] = [
  {
    id: 'series_catalog',
    nameKey: 'feedback.features.seriesCatalog',
    icon: BookOpen,
    suggestionKeys: [
      'feedback.suggestions.series_1',
      'feedback.suggestions.series_2',
      'feedback.suggestions.series_3',
    ],
  },
  {
    id: 'lab_workspace',
    nameKey: 'feedback.features.labWorkspace',
    icon: Code2,
    suggestionKeys: [
      'feedback.suggestions.lab_1',
      'feedback.suggestions.lab_2',
      'feedback.suggestions.lab_3',
    ],
  },
  {
    id: 'code_runner',
    nameKey: 'feedback.features.codeRunner',
    icon: Terminal,
    suggestionKeys: [
      'feedback.suggestions.runner_1',
      'feedback.suggestions.runner_2',
      'feedback.suggestions.runner_3',
    ],
  },
  {
    id: 'contributor_studio',
    nameKey: 'feedback.features.contributorStudio',
    icon: PenTool,
    suggestionKeys: [
      'feedback.suggestions.studio_1',
      'feedback.suggestions.studio_2',
      'feedback.suggestions.studio_3',
    ],
  },
  {
    id: 'dashboard_progress',
    nameKey: 'feedback.features.dashboardProgress',
    icon: LayoutDashboard,
    suggestionKeys: [
      'feedback.suggestions.dash_1',
      'feedback.suggestions.dash_2',
      'feedback.suggestions.dash_3',
    ],
  },
  {
    id: 'auth_account',
    nameKey: 'feedback.features.authAccount',
    icon: ShieldCheck,
    suggestionKeys: [
      'feedback.suggestions.auth_1',
      'feedback.suggestions.auth_2',
      'feedback.suggestions.auth_3',
    ],
  },
];

export function FeedbackWidget() {
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-study-feedback', handleOpen);
    return () => window.removeEventListener('open-study-feedback', handleOpen);
  }, []);

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
      setErrorMsg(t('feedback.minCharsError'));
      return;
    }

    // Embed selected system feature ID into message header for machine-readable diagnostic tracking
    const finalMessage = activeFeature
      ? `[Area: ${activeFeature.id}] ${trimmedMsg}`
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
        t('feedback.error');
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
          aria-label={t('feedback.triggerAria')}
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
                {t('feedback.success')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t('feedback.successDesc')}
              </DialogDescription>
            </div>
            <div className="pt-2 flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border"
                onClick={() => resetForm()}
              >
                {t('feedback.sendAnother')}
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                {t('feedback.close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {t('feedback.title')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t('feedback.subtitle')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Category Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('feedback.categoryLabel')}
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
                        <span>{t(cat.labelKey)}</span>
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
                    {t('feedback.relatedFeatures')}
                  </label>
                  {activeFeature && (
                    <button
                      type="button"
                      onClick={() => setSelectedFeatureId(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      {t('feedback.deselect')}
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
                        <span className="truncate">{t(feat.nameKey)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Contextual Quick Suggestion Chips */}
                {activeFeature && (
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t('feedback.commonSuggestions', { feature: t(activeFeature.nameKey) })}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFeature.suggestionKeys.map((sugKey) => {
                        const sugText = t(sugKey);
                        return (
                          <button
                            key={sugKey}
                            type="button"
                            onClick={() => handleApplySuggestion(sugText)}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-primary/10 hover:text-primary border border-border transition-colors text-left text-foreground/80 cursor-pointer"
                          >
                            + {sugText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity or Guest Email */}
              {isAuthenticated && user ? (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>{t('feedback.sendingAs')}</span>
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {user.name || user.email}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="feedback-email" className="text-xs font-medium text-foreground">
                    {t('feedback.emailLabel')}{' '}
                    <span className="text-muted-foreground font-normal">{t('feedback.emailOptional')}</span>
                  </label>
                  <Input
                    id="feedback-email"
                    type="email"
                    placeholder={t('feedback.emailPlaceholder')}
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
                    {t('feedback.messageLabel')} <span className="text-destructive">*</span>
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
                  placeholder={t('feedback.messagePlaceholder')}
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
                      {t('feedback.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      {t('feedback.submit')}
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
