import { useState, useEffect, useMemo, useRef } from 'react';
import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import type { FormativeQuestion } from '@/types/lab.types';
import { renderMarkdown } from '@/pages/lab/_components/renderMarkdown';
import { labApi } from '../api/lab.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  CheckCircle2,
  ListCollapse,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function TheoryLessonView({
  lab,
  onSubmit,
  isSubmitting = false,
}: WorkspaceStrategyProps) {
  const instructions =
    ('envelope' in lab && (lab as any).envelope
      ? (lab as any).envelope.instructions
      : (lab as any).instructions) || '';

  // Extract formative questions from envelope or lab config
  const formativeQuestions: FormativeQuestion[] = useMemo(() => {
    if ('envelope' in lab && lab.envelope && lab.envelope.sandboxType === 'markdown_only') {
      return (lab.envelope.config as any)?.formativeQuestions || [];
    }
    const rawConfig = (lab as any).config || {};
    return rawConfig.formativeQuestions || (lab as any).formativeQuestions || [];
  }, [lab]);

  // Reading progress state
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    () => lab.progress?.status === 'COMPLETED' || lab.userStatus === 'passed'
  );
  const [formativeAnswers, setFormativeAnswers] = useState<Record<string, number>>({});
  const [showTOC, setShowTOC] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract Table of Contents headings
  const tocHeadings = useMemo(() => {
    const lines = instructions.split('\n');
    const headings: Array<{ id: string; text: string; depth: number }> = [];
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const depth = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, depth });
      }
    }
    return headings;
  }, [instructions]);

  const scrollToHeading = (id: string) => {
    if (!containerRef.current) return;
    const target = containerRef.current.querySelector(`#${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const percent = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 100;
    setScrollPercent(Math.min(100, Math.max(0, percent)));
  };

  // Debounced position saving
  useEffect(() => {
    if (!lab?.id) return;
    const timer = setTimeout(() => {
      labApi.updateTheoryPosition(lab.id, {
        scrollPercent,
        formativeAnswers,
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [lab?.id, scrollPercent, formativeAnswers]);

  // Start theory progress on initial mount
  useEffect(() => {
    if (lab?.id && lab.progress?.status === 'NOT_STARTED') {
      labApi.startTheoryProgress(lab.id).catch(() => {});
    }
  }, [lab?.id, lab.progress?.status]);

  const handleSelectFormative = (qId: string, optionIdx: number) => {
    setFormativeAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleCompleteLesson = async () => {
    if (isCompleted || isSubmitting) return;

    try {
      await labApi.completeTheoryProgress(lab.id, { score: 100 });
      setIsCompleted(true);
      await onSubmit({
        submittedCode: '// theory-lesson-read',
        status: 'passed',
        timeMs: 60,
        testLogs: 'Theory lesson completed successfully.',
      });
    } catch {
      // Still mark completed locally and trigger submission
      setIsCompleted(true);
      await onSubmit({
        submittedCode: '// theory-lesson-read',
        status: 'passed',
        timeMs: 60,
        testLogs: 'Theory lesson completed.',
      });
    }
  };

  const renderedContentHtml = useMemo(() => {
    return renderMarkdown(instructions);
  }, [instructions]);

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      {/* ── Top Reading Progress Bar ───────────────────────────────────────── */}
      <div className="w-full h-1 bg-muted shrink-0 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      {/* ── Action Bar / Quick Stats ───────────────────────────────────────── */}
      <div className="h-10 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <span className="font-semibold text-foreground">Interactive Theory Lesson</span>
          <span className="text-muted-foreground/60 hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            {lab.durationMinutes || 10} min estimated read
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {scrollPercent}% read
          </span>
          {tocHeadings.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTOC(!showTOC)}
              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground hidden lg:flex"
            >
              <ListCollapse className="size-3.5" />
              <span>{showTOC ? 'Hide Outline' : 'Show Outline'}</span>
            </Button>
          )}
          {isCompleted && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] gap-1 py-0.5">
              <CheckCircle2 className="size-3" />
              <span>Completed</span>
            </Badge>
          )}
        </div>
      </div>

      {/* ── Main Layout (Content + Sticky Outline) ─────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Main Article Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 focus:outline-hidden"
          tabIndex={0}
          role="region"
          aria-label="Lesson content"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Title & Metadata Banner */}
            <div className="space-y-3 pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5">
                  Lesson
                </Badge>
                {lab.isFreePreview && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                    Free Lesson
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {lab.title}
              </h1>
            </div>

            {/* Markdown Body */}
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
            />

            {/* Formative Interactive Mini-Quiz Checks */}
            {formativeQuestions.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" />
                  <h3 className="text-base font-bold text-foreground">
                    Concept Check ({formativeQuestions.length}{' '}
                    {formativeQuestions.length === 1 ? 'question' : 'questions'})
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  Check your understanding before continuing. These formative questions are retryable and won't penalize your score.
                </p>

                <div className="space-y-4">
                  {formativeQuestions.map((q, qIdx) => {
                    const selected = formativeAnswers[q.id];
                    const isAnswered = selected !== undefined;
                    const hasAnswerKey = typeof q.correctIndex === 'number';
                    const isCorrect = hasAnswerKey && selected === q.correctIndex;

                    return (
                      <div
                        key={q.id || qIdx}
                        className={`p-4 rounded-xl border bg-card/60 transition-all ${
                          isAnswered
                            ? isCorrect
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-amber-500/40 bg-amber-500/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground mt-0.5">
                            {qIdx + 1}
                          </span>
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {q.question}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="mt-3 space-y-2 pl-7">
                          {q.options.map((opt, optIdx) => {
                            const isThisSelected = selected === optIdx;
                            const isThisCorrect = hasAnswerKey && q.correctIndex === optIdx;

                            let optStyle = 'border-border hover:bg-muted/50 text-foreground';
                            if (isThisSelected) {
                              if (isCorrect) {
                                optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium';
                              } else {
                                optStyle = 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium';
                              }
                            } else if (isAnswered && !isCorrect && isThisCorrect) {
                              optStyle = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectFormative(q.id, optIdx)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {isThisSelected && (
                                  <span className="shrink-0 text-xs">
                                    {isCorrect ? '✓ Correct' : '✕ Try again'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation / Feedback */}
                        {isAnswered && (
                          <div className="mt-3 pl-7 text-xs leading-relaxed">
                            {isCorrect ? (
                              <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {q.explanation || 'Excellent! You selected the right answer.'}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {q.hint && (
                                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                                    Hint: {q.hint}
                                  </p>
                                )}
                                {q.explanation && (
                                  <p className="text-muted-foreground">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Completion & Continue Card ───────────────────────────────── */}
            <div className="p-6 rounded-2xl border border-border bg-card/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {isCompleted ? 'Lesson Completed!' : 'Finished Reading?'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isCompleted
                      ? 'You have finished this lesson. Proceed to the next exercise or practice lab.'
                      : 'Mark this lesson as completed to track your progress in this series.'}
                  </p>
                </div>
                {isCompleted && (
                  <div className="flex size-8 rounded-full bg-emerald-500/10 text-emerald-600 items-center justify-center shrink-0">
                    <CheckCircle2 className="size-5" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                {!isCompleted ? (
                  <Button
                    onClick={handleCompleteLesson}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-semibold gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Complete Lesson & Continue</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Navigate or trigger parent dialog
                      onSubmit({ submittedCode: '// theory-lesson-read', status: 'passed', timeMs: 60, testLogs: 'Continue' });
                    }}
                    className="w-full sm:w-auto font-semibold gap-2"
                  >
                    <span>Continue Next</span>
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Desktop Outline (TOC) */}
        {showTOC && tocHeadings.length > 0 && (
          <aside className="w-64 border-l border-border bg-card/40 p-4 shrink-0 overflow-y-auto hidden lg:block">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              On this page
            </h4>
            <nav className="space-y-1">
              {tocHeadings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHeading(h.id);
                  }}
                  className={`block text-xs py-1 rounded transition-colors text-muted-foreground hover:text-foreground truncate ${
                    h.depth === 3 ? 'pl-3' : 'font-medium'
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
