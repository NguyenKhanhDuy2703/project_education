import React from 'react';
import type { QuizQuestionV1 } from '../../../types/lab.types';
import type { QuestionGradingDetail } from '../quiz/quizGrading';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export interface QuizQuestionCardProps {
  question: QuizQuestionV1;
  index: number;
  selectedOptionIndex?: number;
  onSelectOption: (optionIndex: number) => void;
  isSubmitted: boolean;
  gradingDetail?: QuestionGradingDetail;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  index,
  selectedOptionIndex,
  onSelectOption,
  isSubmitted,
  gradingDetail,
}) => {
  return (
    <div
      id={`question-${index}`}
      className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4 scroll-mt-6"
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Question {index + 1}
          </span>
          <h3 className="text-sm md:text-base font-medium text-foreground leading-relaxed">
            {question.question}
          </h3>
        </div>

        {/* Post-submit status pill */}
        {isSubmitted && gradingDetail && (
          <div className="shrink-0">
            {gradingDetail.isCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" />
                Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <XCircle className="size-3.5" />
                Incorrect
              </span>
            )}
          </div>
        )}
      </div>

      {/* Options List */}
      <div role="radiogroup" aria-label={`Question ${index + 1}`} className="space-y-2.5">
        {question.options.map((option, optIdx) => {
          const isSelected = selectedOptionIndex === optIdx;
          const letter = OPTION_LETTERS[optIdx] || String(optIdx + 1);

          let optionStyle =
            'border-border hover:border-primary/50 hover:bg-muted/30 bg-background text-foreground';

          if (isSubmitted) {
            if (optIdx === question.correctIndex) {
              optionStyle =
                'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 font-medium ring-1 ring-emerald-500';
            } else if (isSelected && !gradingDetail?.isCorrect) {
              optionStyle =
                'border-destructive bg-destructive/10 text-destructive font-medium ring-1 ring-destructive';
            } else {
              optionStyle = 'opacity-60 border-border bg-muted/20 text-muted-foreground';
            }
          } else if (isSelected) {
            optionStyle =
              'border-primary bg-primary/10 text-foreground ring-1 ring-primary font-medium';
          }

          return (
            <label
              key={optIdx}
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                isSubmitted ? 'cursor-default pointer-events-none' : ''
              } ${optionStyle}`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={optIdx}
                checked={isSelected}
                disabled={isSubmitted}
                onChange={() => !isSubmitted && onSelectOption(optIdx)}
                className="sr-only"
                aria-label={`Option ${letter}: ${option}`}
              />

              {/* Letter Badge */}
              <span
                className={`size-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSubmitted && optIdx === question.correctIndex
                    ? 'bg-emerald-500 text-white'
                    : isSubmitted && isSelected && !gradingDetail?.isCorrect
                    ? 'bg-destructive text-white'
                    : isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {letter}
              </span>

              {/* Option Text */}
              <span className="text-sm flex-1 leading-normal">{option}</span>

              {/* Status Icons on Submit */}
              {isSubmitted && optIdx === question.correctIndex && (
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              )}
              {isSubmitted && isSelected && !gradingDetail?.isCorrect && (
                <XCircle className="size-4 text-destructive shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {/* Post-submit Explanation Section (Only shown after submission - DEC-08) */}
      {isSubmitted && question.explanation && (
        <div className="mt-3 p-3.5 rounded-lg border border-border/80 bg-muted/40 text-xs text-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
            <HelpCircle className="size-3.5 text-primary" />
            <span>Explanation</span>
          </div>
          <p className="leading-relaxed pl-5">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
