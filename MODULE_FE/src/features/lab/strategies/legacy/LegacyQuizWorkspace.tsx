import { useState, useMemo } from 'react';
import type { WorkspaceStrategyProps } from '../workspaceStrategy.types';
import type { QuizQuestion, QuizLabConfig } from '@/types/lab.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { renderMarkdown } from '@/pages/lab/_components/renderMarkdown';

export function LegacyQuizWorkspace({ lab, onSubmit, isSubmitting }: WorkspaceStrategyProps) {
  const quizList: QuizQuestion[] = useMemo(() => {
    if (lab.envelope && lab.envelope.sandboxType === 'quizlet') {
      const config = lab.envelope.config as QuizLabConfig;
      if (config.questions && config.questions.length > 0) return config.questions;
    }
    return [];
  }, [lab]);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  const currentQuiz = quizList[currentQuizIndex];
  const progressPercent = quizList.length > 0 ? Math.round(((currentQuizIndex + 1) / quizList.length) * 100) : 0;

  if (!currentQuiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p>No questions configured for this quiz.</p>
      </div>
    );
  }

  const selectedAnswer = selectedAnswers[currentQuiz.id];
  const isCurrentQuizChecked = Boolean(checkedQuestions[currentQuiz.id]);
  const isLastQuestion = currentQuizIndex === quizList.length - 1;

  const handleSelectOption = (qId: string, optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleCheckAnswer = (qId: string) => {
    setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
  };

  const handleNextQuiz = () => {
    if (!isLastQuestion) {
      setCurrentQuizIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuiz = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex((prev) => prev - 1);
    }
  };

  const handleFinishQuiz = async () => {
    let correctCount = 0;
    quizList.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const isPassed = correctCount === quizList.length;
    await onSubmit({
      submittedCode: JSON.stringify(selectedAnswers),
      status: isPassed ? 'passed' : 'failed',
      timeMs: 500,
      testLogs: `Scored ${correctCount}/${quizList.length} correct answers`,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-2xl mx-auto w-full space-y-6">
      {/* Quiz progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Question <strong className="text-foreground">{currentQuizIndex + 1}</strong> of {quizList.length}
          </span>
          <span>Progress: {progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-start gap-2.5">
          <Badge variant="secondary" className="font-mono text-xs font-bold px-2 py-0.5 mt-0.5">
            Question {currentQuizIndex + 1}
          </Badge>
          <div
            className="font-bold text-sm sm:text-base text-foreground leading-snug prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQuiz.question) }}
          />
        </div>

        {/* Options list */}
        <div className="space-y-2.5 pt-2">
          {currentQuiz.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQuiz.correctIndex;

            let optionStyle = 'border-border bg-card hover:bg-muted/30';
            if (isSelected) {
              optionStyle = 'border-primary ring-1 ring-primary bg-primary/5';
            }
            if (isCurrentQuizChecked) {
              if (isCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-destructive bg-destructive/10 text-destructive font-semibold';
              }
            }

            return (
              <div
                key={i}
                onClick={() => !isCurrentQuizChecked && handleSelectOption(currentQuiz.id, i)}
                className={`p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="size-6 rounded-md border border-border flex items-center justify-center font-mono text-xs font-bold text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </div>
                {isCurrentQuizChecked && isCorrect && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500 font-bold">
                    CORRECT
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Check answer action */}
        {!isCurrentQuizChecked && selectedAnswer !== undefined && (
          <Button
            size="sm"
            onClick={() => handleCheckAnswer(currentQuiz.id)}
            className="text-xs font-semibold"
          >
            Check Answer
          </Button>
        )}

        {/* Hint toggle */}
        {currentQuiz.hint && !isCurrentQuizChecked && (
          <div className="pt-1">
            <button
              onClick={() => setShowHint((p) => ({ ...p, [currentQuiz.id]: !p[currentQuiz.id] }))}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {showHint[currentQuiz.id] ? 'Hide hint' : '💡 Need a hint?'}
            </button>
            {showHint[currentQuiz.id] && (
              <p className="text-xs text-muted-foreground italic mt-1.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                {currentQuiz.hint}
              </p>
            )}
          </div>
        )}

        {/* Explanation once checked */}
        {isCurrentQuizChecked && currentQuiz.explanation && (
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs leading-relaxed space-y-1">
            <span className="font-semibold text-foreground">Explanation:</span>
            <p className="text-muted-foreground">{currentQuiz.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevQuiz}
          disabled={currentQuizIndex === 0}
          className="text-xs"
        >
          Previous Question
        </Button>

        {isLastQuestion ? (
          <Button
            size="sm"
            onClick={handleFinishQuiz}
            disabled={!isCurrentQuizChecked || isSubmitting}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Complete & Submit Quiz'}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNextQuiz}
            disabled={!isCurrentQuizChecked}
            className="text-xs font-semibold"
          >
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
}
