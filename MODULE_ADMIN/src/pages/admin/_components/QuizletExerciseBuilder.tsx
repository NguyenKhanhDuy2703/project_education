import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Eye,
  Edit3,
  Upload,
  Undo2,
} from 'lucide-react';
import type { QuizQuestion } from '@/types/lab.types';
import { renderMarkdown } from '../_utils/renderMarkdown';

interface QuizletExerciseBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onValidationChange?: (isValid: boolean, hasRunPassed: boolean) => void;
}

export function QuizletExerciseBuilder({
  questions,
  onChange,
  onValidationChange,
}: QuizletExerciseBuilderProps) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [questionPreviewMode, setQuestionPreviewMode] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

  // Undo Toast state
  const [deletedBackup, setDeletedBackup] = useState<{
    item: QuizQuestion;
    index: number;
    timerId: any;
  } | null>(null);

  const currentQuestion = questions[activeQuestionIndex] || questions[0];

  // Helper to check question status
  const getQuestionStatus = (q: QuizQuestion): 'ready' | 'warning' | 'empty' => {
    if (!q || (!q.question.trim() && q.options.every((o) => !o.trim()))) return 'empty';
    if (!q.question.trim() || q.options.length < 2 || q.options.some((o) => !o.trim())) return 'warning';
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return 'warning';
    return 'ready';
  };

  const statuses = useMemo(() => {
    return questions.map((q) => getQuestionStatus(q));
  }, [questions]);

  const allReady = useMemo(() => {
    return questions.length > 0 && statuses.every((s) => s === 'ready');
  }, [questions, statuses]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(allReady, allReady);
    }
  }, [allReady, onValidationChange]);

  // Handlers for active question
  const handleUpdateCurrentQuestion = (updated: Partial<QuizQuestion>) => {
    const nextList = [...questions];
    nextList[activeQuestionIndex] = { ...nextList[activeQuestionIndex], ...updated };
    onChange(nextList);
  };

  const handleUpdateOption = (optIdx: number, val: string) => {
    const nextOpts = [...currentQuestion.options];
    nextOpts[optIdx] = val;
    handleUpdateCurrentQuestion({ options: nextOpts });
  };

  const handleAddOption = () => {
    if (currentQuestion.options.length >= 6) {
      alert('A multiple-choice question supports a maximum of 6 options.');
      return;
    }
    const nextOpts = [...currentQuestion.options, `Option ${String.fromCharCode(65 + currentQuestion.options.length)}`];
    handleUpdateCurrentQuestion({ options: nextOpts });
  };

  const handleRemoveOption = (optIdx: number) => {
    if (currentQuestion.options.length <= 2) {
      alert('A multiple-choice question requires at least 2 options.');
      return;
    }
    const nextOpts = currentQuestion.options.filter((_, i) => i !== optIdx);
    let nextCorrect = currentQuestion.correctIndex;
    if (nextCorrect >= nextOpts.length) {
      nextCorrect = nextOpts.length - 1;
    }
    handleUpdateCurrentQuestion({ options: nextOpts, correctIndex: nextCorrect });
  };

  const handleAddQuestion = () => {
    if (questions.length >= 30) {
      alert('A Quizlet lab supports a maximum of 30 questions.');
      return;
    }
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: `Question ${questions.length + 1}: Enter question content (Markdown supported)...`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Explanation for why this option is correct.',
    };
    const nextList = [...questions, newQ];
    onChange(nextList);
    setActiveQuestionIndex(nextList.length - 1);
  };

  const handleDeleteCurrentQuestion = () => {
    if (questions.length <= 1) {
      alert('A Quizlet lab requires at least 1 question.');
      return;
    }

    const removedItem = currentQuestion;
    const removedIndex = activeQuestionIndex;
    const nextList = questions.filter((_, i) => i !== activeQuestionIndex);
    onChange(nextList);
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));

    // Clear previous undo timer if any
    if (deletedBackup?.timerId) {
      clearTimeout(deletedBackup.timerId);
    }

    // Set 5-second undo toast
    const timerId = setTimeout(() => {
      setDeletedBackup(null);
    }, 5000);

    setDeletedBackup({
      item: removedItem,
      index: removedIndex,
      timerId,
    });
  };

  const handleUndoDelete = () => {
    if (!deletedBackup) return;
    clearTimeout(deletedBackup.timerId);
    const nextList = [...questions];
    nextList.splice(deletedBackup.index, 0, deletedBackup.item);
    onChange(nextList);
    setActiveQuestionIndex(deletedBackup.index);
    setDeletedBackup(null);
  };

  // Bulk Import from Markdown parser
  const handleExecuteBulkImport = () => {
    if (!bulkImportText.trim()) return;

    try {
      // Split by numbers or ##
      const rawBlocks = bulkImportText.split(/(?:^|\n)(?=\d+[\.\)]|##\s*Câu|##\s*Question)/).filter(Boolean);
      const parsedList: QuizQuestion[] = [];

      rawBlocks.forEach((block, idx) => {
        const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) return;

        // Prompt line
        const prompt = lines[0].replace(/^\d+[\.\)]\s*|^##\s*(?:Câu|Question)\s*\d*[:\.]?\s*/i, '').trim();

        // Option lines (A. B. C. D.)
        const options: string[] = [];
        let correctIndex = 0;
        let explanation = '';

        lines.slice(1).forEach((line) => {
          const optMatch = line.match(/^([A-Fa-f])[\.\)]\s*(.+)/);
          if (optMatch) {
            options.push(optMatch[2].trim());
          } else if (line.toLowerCase().startsWith('đáp án:') || line.toLowerCase().startsWith('answer:')) {
            const letter = line.split(':')[1]?.trim()?.toUpperCase();
            if (letter) {
              const code = letter.charCodeAt(0) - 65;
              if (code >= 0 && code < 6) {
                correctIndex = code;
              }
            }
          } else if (line.toLowerCase().startsWith('giải thích:') || line.toLowerCase().startsWith('explanation:')) {
            explanation = line.replace(/^(?:giải thích|explanation):\s*/i, '').trim();
          }
        });

        if (prompt && options.length >= 2) {
          parsedList.push({
            id: `q-bulk-${idx}-${Date.now()}`,
            question: prompt,
            options,
            correctIndex: Math.min(correctIndex, options.length - 1),
            explanation,
          });
        }
      });

      if (parsedList.length > 0) {
        onChange(parsedList);
        setActiveQuestionIndex(0);
        setIsBulkImportOpen(false);
        setBulkImportText('');
        alert(`Successfully imported ${parsedList.length} multiple-choice questions!`);
      } else {
        alert('No valid questions found. Ensure format matches: 1. Question prompt, A. Option A, B. Option B, Answer: A.');
      }
    } catch (err: any) {
      alert('Parse error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Undo Floating Toast (5s countdown) ─────────────────────── */}
      {deletedBackup && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs text-foreground font-medium">
            Deleted Question #{deletedBackup.index + 1}.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleUndoDelete}
            className="h-7 text-xs font-bold gap-1 bg-primary text-primary-foreground"
          >
            <Undo2 className="size-3" />
            <span>Undo (5s)</span>
          </Button>
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Quizlet Multiple-Choice Studio</h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {questions.length} / 30 QUESTIONS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each question supports 2 to 6 options with Markdown formatting and student simulation preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsBulkImportOpen(true)}
            className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <Upload className="size-3.5" />
            <span>Import from Markdown</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAddQuestion}
            disabled={questions.length >= 30}
            className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Question ({questions.length}/30)</span>
          </Button>
        </div>
      </div>

      {/* ── Bulk Import Modal ───────────────────────────────────────── */}
      {isBulkImportOpen && (
        <div className="p-5 rounded-2xl border border-primary/30 bg-card shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Bulk Import Questions from Markdown
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBulkImportOpen(false)}
              className="h-6 text-xs text-muted-foreground"
            >
              Close
            </Button>
          </div>

          <textarea
            rows={7}
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder={`1. What index does PostgreSQL use by default for PRIMARY KEY constraints?\nA. Hash Index\nB. B-Tree Index\nC. GiST Index\nD. GIN Index\nAnswer: B\nExplanation: B-Tree indexes are optimized for equality and range queries.`}
            className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkImportOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteBulkImport}
              className="text-xs font-bold bg-primary text-primary-foreground"
            >
              Parse &amp; Import Questions
            </Button>
          </div>
        </div>
      )}

      {/* ── 3-Column Studio Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Question Navigator (3 Cols on lg) */}
        <div className="lg:col-span-3 p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Questions List
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {statuses.filter((s) => s === 'ready').length}/{questions.length} Ready
            </span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const status = statuses[idx];
              const isSelected = activeQuestionIndex === idx;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                      : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-5 rounded-md bg-muted text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs truncate">
                      {q.question.replace(/^[#\*\s]+/, '') || `Question ${idx + 1}`}
                    </span>
                  </div>

                  {status === 'ready' && (
                    <span title="Complete and valid">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </span>
                  )}
                  {status === 'warning' && (
                    <span title="Incomplete options or missing correct answer">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                    </span>
                  )}
                  {status === 'empty' && (
                    <span title="Missing question prompt">
                      <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            disabled={questions.length >= 30}
            className="w-full h-8 text-xs font-semibold gap-1"
          >
            <Plus className="size-3.5" />
            <span>Add New Question</span>
          </Button>
        </div>

        {/* Center Column: Active Question Editor (5 Cols on lg) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Question #{activeQuestionIndex + 1}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  statuses[activeQuestionIndex] === 'ready'
                    ? 'border-emerald-500/40 text-emerald-600'
                    : 'border-amber-500/40 text-amber-600'
                }`}
              >
                {statuses[activeQuestionIndex] === 'ready' ? 'Valid ✓' : 'Incomplete ⚠'}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuestionPreviewMode(!questionPreviewMode)}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground"
              >
                {questionPreviewMode ? <Edit3 className="size-3" /> : <Eye className="size-3" />}
                <span>{questionPreviewMode ? 'Edit' : 'Preview Markdown'}</span>
              </Button>

              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCurrentQuestion}
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  title="Delete this question"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
              Question Prompt (Markdown) *
            </label>
            {questionPreviewMode ? (
              <div
                className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQuestion.question) }}
              />
            ) : (
              <textarea
                rows={3}
                required
                value={currentQuestion.question}
                onChange={(e) => handleUpdateCurrentQuestion({ question: e.target.value })}
                placeholder="e.g. Which index structure is default in PostgreSQL when creating a `PRIMARY KEY`?"
                className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            )}
          </div>

          {/* Answer choices (2 to 6 options) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Answer Options ({currentQuestion.options.length}/6) *
              </label>
              {currentQuestion.options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-6 text-[11px] px-2 text-primary"
                >
                  + Add Option
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((opt, optIdx) => {
                const isCorrect = currentQuestion.correctIndex === optIdx;

                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      isCorrect
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-border/80 bg-background/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-correct-${activeQuestionIndex}`}
                      checked={isCorrect}
                      onChange={() => handleUpdateCurrentQuestion({ correctIndex: optIdx })}
                      className="size-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Mark as correct answer"
                    />

                    <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                      {String.fromCharCode(65 + optIdx)}
                    </span>

                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 bg-transparent border-0 text-xs text-foreground focus:outline-none font-medium"
                    />

                    {isCorrect && (
                      <Badge className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0 h-4 shrink-0">
                        Correct Answer ✓
                      </Badge>
                    )}

                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Remove option"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
              Answer Explanation (Revealed after submission)
            </label>
            <textarea
              rows={2}
              value={currentQuestion.explanation || ''}
              onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
              placeholder="Explain why this option is correct..."
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Live Student Perspective Preview (4 Cols on lg) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="size-3.5 text-primary" />
              <span>Student Simulation (Live Preview)</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              PREVIEW
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Student Card simulation */}
            <div className="p-4 rounded-xl border border-border bg-background space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {activeQuestionIndex + 1} of {questions.length}</span>
                <span className="font-mono">1 Point</span>
              </div>

              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground font-medium leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    renderMarkdown(currentQuestion.question) ||
                    '<p class="italic text-muted-foreground">Enter question prompt to preview...</p>',
                }}
              />

              <div className="space-y-2 pt-2">
                {currentQuestion.options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-colors text-xs cursor-pointer"
                  >
                    <span className="size-5 rounded border border-border/80 text-[10px] font-mono font-bold flex items-center justify-center bg-muted/30">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-foreground">{opt || `(Option ${String.fromCharCode(65 + i)})`}</span>
                  </div>
                ))}
              </div>

              {currentQuestion.explanation && (
                <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                  <span className="font-bold text-foreground block">💡 Explanation:</span>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
