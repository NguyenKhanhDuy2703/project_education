import { useState, useMemo } from 'react';
import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import type { QuizQuestionV1 } from '../../../types/lab.types';
import { gradeQuiz, getUnansweredQuestionIds, type QuizGradingResult } from '../quiz/quizGrading';
import { encodeQuizSubmission, decodeQuizSubmission } from '../quiz/quizSubmissionCodec';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuestionPaletteModal } from '../components/QuestionPaletteModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  LayoutGrid,
  CloudUpload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

export function QuizAssignmentWorkspace({
  lab,
  code,
  onCodeChange,
  onSubmit,
  isSubmitting = false,
  onResetCode,
}: WorkspaceStrategyProps) {
  // 1. Extract questions
  const questions: QuizQuestionV1[] = useMemo(() => {
    if (lab.envelope && lab.envelope.sandboxType === 'quizlet') {
      return lab.envelope.config.questions || [];
    }
    return (lab as any).quizQuestions || (lab as any).quizList || [];
  }, [lab]);

  const passPercentage =
    lab.envelope && lab.envelope.sandboxType === 'quizlet'
      ? lab.envelope.config.passPercentage || 70
      : 70;

  // 2. Answers & submission state
  const initialSubmission = useMemo(() => decodeQuizSubmission(code), [code]);

  const [answers, setAnswers] = useState<Record<string, number>>(
    () => initialSubmission?.answers || {}
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => Boolean(initialSubmission));
  const [gradingResult, setGradingResult] = useState<QuizGradingResult | null>(() => {
    if (initialSubmission && questions.length > 0) {
      const hasCorrectIndices = questions.some((q) => typeof q.correctIndex === 'number');
      if (hasCorrectIndices) {
        return gradeQuiz(questions, initialSubmission.answers, passPercentage);
      }
      const total = initialSubmission.totalQuestions || questions.length;
      const score = initialSubmission.scorePercentage ?? 0;
      return {
        totalQuestions: total,
        answeredCount: Object.keys(initialSubmission.answers || {}).length,
        unansweredCount: total - Object.keys(initialSubmission.answers || {}).length,
        unansweredQuestionIds: [],
        correctCount: initialSubmission.correctCount ?? Math.round((score / 100) * total),
        scorePercentage: score,
        isPassed: score >= passPercentage,
        details: [],
      };
    }
    return null;
  });

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState(false);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const submitting = isSubmitting || isSubmittingLocal;

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] >= 0
  ).length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    const nextAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(nextAnswers);
  };

  const handleJumpToQuestion = (index: number) => {
    const el = document.getElementById(`question-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleResetQuiz = () => {
    if (window.confirm('Reset all answers and retake this quiz?')) {
      setAnswers({});
      setIsSubmitted(false);
      setGradingResult(null);
      if (onResetCode) onResetCode();
    }
  };

  const performSubmission = async (answersToSubmit: Record<string, number>) => {
    if (submitting) return;
    setIsSubmittingLocal(true);

    const hasCorrectIndices = questions.some((q) => typeof q.correctIndex === 'number');
    const localResult = hasCorrectIndices ? gradeQuiz(questions, answersToSubmit, passPercentage) : null;

    const submissionPayload = encodeQuizSubmission({
      version: '1.0',
      scorePercentage: localResult?.scorePercentage ?? 0,
      correctCount: localResult?.correctCount ?? 0,
      totalQuestions: questions.length,
      answers: answersToSubmit,
      submittedAt: new Date().toISOString(),
    });

    onCodeChange(submissionPayload);

    try {
      const submitResponse = await onSubmit({
        submittedCode: submissionPayload,
        status: localResult ? (localResult.isPassed ? 'passed' : 'failed') : 'passed',
        timeMs: 60,
        testLogs: 'Quiz attempt submitted for authoritative evaluation.',
      });

      setIsSubmitted(true);

      if (submitResponse?.review) {
        const rev = submitResponse.review;
        const details = Array.isArray(rev.details)
          ? rev.details.map((d: any) => ({
              questionId: d.questionId,
              selectedOptionIndex: d.selectedOptionIndex,
              correctOptionIndex: d.correctOptionIndex,
              isCorrect: d.isCorrect,
              isAnswered: d.selectedOptionIndex !== null && d.selectedOptionIndex !== undefined,
              explanation: d.explanation,
            }))
          : [];

        const totalQuestions = rev.totalQuestions || questions.length;
        const correctCount =
          rev.correctCount !== undefined
            ? rev.correctCount
            : rev.passedQuestionsCount !== undefined
            ? rev.passedQuestionsCount
            : details.filter((d: any) => d.isCorrect).length;

        const scorePercentage =
          rev.scorePercentage !== undefined
            ? rev.scorePercentage
            : totalQuestions > 0
            ? Math.round((correctCount / totalQuestions) * 100)
            : 0;

        const isPassed =
          rev.isPassed !== undefined
            ? Boolean(rev.isPassed)
            : rev.passed !== undefined
            ? Boolean(rev.passed)
            : submitResponse?.status === 'passed' || scorePercentage >= passPercentage;

        setGradingResult({
          totalQuestions,
          answeredCount: Object.keys(answersToSubmit).length,
          unansweredCount: totalQuestions - Object.keys(answersToSubmit).length,
          unansweredQuestionIds: getUnansweredQuestionIds(questions, answersToSubmit),
          correctCount,
          scorePercentage,
          isPassed,
          details,
        });
      } else if (localResult) {
        setGradingResult(localResult);
      } else {
        const isPassed = submitResponse?.status === 'passed';
        setGradingResult({
          totalQuestions: questions.length,
          answeredCount: Object.keys(answersToSubmit).length,
          unansweredCount: questions.length - Object.keys(answersToSubmit).length,
          unansweredQuestionIds: getUnansweredQuestionIds(questions, answersToSubmit),
          correctCount: isPassed ? questions.length : 0,
          scorePercentage: isPassed ? 100 : 0,
          isPassed,
          details: [],
        });
      }
    } catch (err) {
      if (localResult) {
        setGradingResult(localResult);
        setIsSubmitted(true);
      }
      throw err;
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (isSubmitted || submitting) return;

    const unansweredIds = getUnansweredQuestionIds(questions, answers);
    if (unansweredIds.length > 0) {
      setIsWarningOpen(true);
      return;
    }

    await performSubmission(answers);
  };

  const handleConfirmSubmitAnyway = async () => {
    setIsWarningOpen(false);
    await performSubmission(answers);
  };

  const handleContinueAnswering = () => {
    setIsWarningOpen(false);
    const unansweredIds = getUnansweredQuestionIds(questions, answers);
    if (unansweredIds.length > 0) {
      const firstUnansweredIndex = questions.findIndex((q) => q.id === unansweredIds[0]);
      if (firstUnansweredIndex !== -1) {
        handleJumpToQuestion(firstUnansweredIndex);
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col min-w-0 min-h-0 bg-background overflow-hidden">
      {/* ── Top Sticky Toolbar ────────────────────────────────────────────── */}
      <div className="h-10 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-purple-500" />
          <span className="text-xs font-semibold text-foreground">
            Knowledge Check
          </span>
          <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {answeredCount}/{questions.length} Answered
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Review Concepts Drawer Trigger (Task 3.4) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConceptDrawerOpen(true)}
            className="h-7 text-xs gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
            title="Review key concepts & prerequisites"
          >
            <BookOpen className="size-3.5" />
            <span className="hidden sm:inline">Review Concepts</span>
          </Button>

          {/* Question Palette Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaletteOpen(true)}
            className="h-7 text-xs gap-1.5 px-2.5 font-medium"
          >
            <LayoutGrid className="size-3.5" />
            <span>Palette</span>
          </Button>

          {isSubmitted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetQuiz}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
              title="Retake quiz"
            >
              <RotateCcw className="size-3" />
              <span>Retake</span>
            </Button>
          )}

          {/* Post-submit Score Badge */}
          {isSubmitted && gradingResult && (
            <Badge
              role="status"
              aria-live="polite"
              variant={gradingResult.isPassed ? 'default' : 'destructive'}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              {gradingResult.isPassed ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>Passed: {gradingResult.scorePercentage}% ({gradingResult.correctCount}/{gradingResult.totalQuestions})</span>
                </>
              ) : (
                <>
                  <XCircle className="size-3.5" />
                  <span>Failed: {gradingResult.scorePercentage}% ({gradingResult.correctCount}/{gradingResult.totalQuestions})</span>
                </>
              )}
            </Badge>
          )}

          {/* Submit Button */}
          {!isSubmitted && (
            <Button
              size="sm"
              onClick={handleSubmitAttempt}
              disabled={submitting}
              className="h-7 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CloudUpload className="size-3" />
              <span>{submitting ? 'Submitting...' : 'Submit Quiz'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Scrollable Question List with Assessment Intro (Task 3.4) ──────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-20 md:pb-24 space-y-6 max-w-4xl w-full mx-auto">
        {/* Short Assessment Intro Banner */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              Knowledge Check
            </Badge>
            <span className="text-xs text-muted-foreground">
              • Passing threshold: {passPercentage}% ({Math.ceil((passPercentage / 100) * questions.length)} of {questions.length} questions)
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {lab.title || 'Module Assessment'}
          </h2>
          {lab.envelope?.instructions && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {lab.envelope.instructions.replace(/^#+\s+/gm, '')}
            </p>
          )}
        </div>

        {questions.map((q, index) => {
          const detail = gradingResult?.details.find((d) => d.questionId === q.id);

          return (
            <QuizQuestionCard
              key={q.id}
              question={q}
              index={index}
              selectedOptionIndex={answers[q.id]}
              onSelectOption={(optIdx) => handleSelectOption(q.id, optIdx)}
              isSubmitted={isSubmitted}
              gradingDetail={detail}
            />
          );
        })}

        {questions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No quiz questions found in this lab.
          </div>
        )}
      </div>

      {/* ── Concept Review Drawer (Task 3.4) ──────────────────────────────── */}
      <Sheet open={isConceptDrawerOpen} onOpenChange={setIsConceptDrawerOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="size-4 text-primary" />
              <span>Prerequisite Concepts &amp; Guide</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <h4 className="font-semibold text-foreground text-xs">Module Overview</h4>
              <p>
                {lab.envelope?.instructions || 'Review the core lessons in this section prior to submitting this knowledge check.'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-purple-700 dark:text-purple-300 space-y-1">
              <h4 className="font-semibold text-xs">Grading &amp; Review Policy</h4>
              <p>
                Answers are evaluated server-authoritatively. Detailed per-question explanations and correct answers become visible after you submit your attempt.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Question Palette Modal ────────────────────────────────────────── */}
      <QuestionPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        questions={questions}
        answers={answers}
        isSubmitted={isSubmitted}
        onSelectQuestion={handleJumpToQuestion}
        gradingResult={gradingResult}
      />

      {/* ── Unanswered Warning Dialog (Subtask 6.4) ────────────────────────── */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="size-5" />
              <span>Incomplete Submission Warning</span>
            </DialogTitle>
            <DialogDescription>
              You have{' '}
              <strong className="text-foreground">
                {questions.length - answeredCount}
              </strong>{' '}
              unanswered question(s). Unanswered questions will receive 0 points.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleContinueAnswering}
              className="flex-1"
            >
              Continue Answering
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSubmitAnyway}
              className="flex-1"
            >
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
