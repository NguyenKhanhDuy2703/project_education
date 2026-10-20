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
  LayoutGrid,
  CloudUpload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  GraduationCap,
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
      return gradeQuiz(questions, initialSubmission.answers, passPercentage);
    }
    return null;
  });

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

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
    const result = gradeQuiz(questions, answersToSubmit, passPercentage);
    setGradingResult(result);
    setIsSubmitted(true);

    const submissionPayload = encodeQuizSubmission({
      version: '1.0',
      scorePercentage: result.scorePercentage,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      answers: answersToSubmit,
      submittedAt: new Date().toISOString(),
    });

    onCodeChange(submissionPayload);

    await onSubmit({
      submittedCode: submissionPayload,
      status: result.isPassed ? 'passed' : 'failed',
      timeMs: 60,
      testLogs: `Quiz graded: ${result.correctCount}/${result.totalQuestions} correct (${result.scorePercentage}%). Threshold: ${passPercentage}%.`,
    });
  };

  const handleSubmitAttempt = async () => {
    if (isSubmitted || isSubmitting) return;

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
          <GraduationCap className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Quiz Assessment
          </span>
          <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {answeredCount}/{questions.length} Answered
          </span>
        </div>

        <div className="flex items-center gap-2">
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
              disabled={isSubmitting}
              className="h-7 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CloudUpload className="size-3" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Quiz'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Scrollable Question List ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-20 md:pb-24 space-y-6 max-w-4xl w-full mx-auto">
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
