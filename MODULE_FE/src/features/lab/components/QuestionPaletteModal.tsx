import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, LayoutGrid } from 'lucide-react';
import type { QuizQuestionV1 } from '../../../types/lab.types';
import type { QuizGradingResult } from '../quiz/quizGrading';

export interface QuestionPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestionV1[];
  answers: Record<string, number>;
  isSubmitted: boolean;
  onSelectQuestion: (index: number) => void;
  gradingResult?: QuizGradingResult | null;
}

export const QuestionPaletteModal: React.FC<QuestionPaletteModalProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  isSubmitted,
  onSelectQuestion,
  gradingResult,
}) => {
  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] >= 0
  ).length;

  const handleJump = (index: number) => {
    onSelectQuestion(index);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            <span>Question Palette</span>
          </DialogTitle>
          <DialogDescription>
            {isSubmitted ? (
              <span>
                Review your results ({gradingResult?.correctCount || 0}/{questions.length} correct)
              </span>
            ) : (
              <span>
                Answered {answeredCount} of {questions.length} questions
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs py-1 border-y border-border">
          {isSubmitted ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-emerald-500 inline-block" />
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-destructive inline-block" />
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-muted-foreground/30 inline-block" />
                <span>Unanswered</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-primary inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full border border-border inline-block" />
                <span>Unanswered</span>
              </div>
            </>
          )}
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2.5 py-4 max-h-64 overflow-y-auto">
          {questions.map((q, idx) => {
            const isAnswered =
              answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] >= 0;

            let btnStyle = 'border border-border hover:bg-muted text-foreground';
            let icon = null;

            if (isSubmitted && gradingResult) {
              const detail = gradingResult.details.find((d) => d.questionId === q.id);
              if (detail?.isCorrect) {
                btnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-transparent';
                icon = <Check className="size-3 ml-0.5" />;
              } else if (detail?.isAnswered) {
                btnStyle = 'bg-destructive hover:bg-destructive/90 text-white font-bold border-transparent';
                icon = <X className="size-3 ml-0.5" />;
              } else {
                btnStyle = 'bg-muted text-muted-foreground border-dashed border-border';
              }
            } else if (isAnswered) {
              btnStyle = 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleJump(idx)}
                className={`h-11 rounded-lg flex items-center justify-center transition-all text-sm shadow-xs ${btnStyle}`}
                aria-label={`Jump to question ${idx + 1}`}
              >
                <span>{idx + 1}</span>
                {icon}
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close Palette
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
