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
      alert('Tối đa 6 lựa chọn cho một câu hỏi trắc nghiệm.');
      return;
    }
    const nextOpts = [...currentQuestion.options, `Lựa chọn ${String.fromCharCode(65 + currentQuestion.options.length)}`];
    handleUpdateCurrentQuestion({ options: nextOpts });
  };

  const handleRemoveOption = (optIdx: number) => {
    if (currentQuestion.options.length <= 2) {
      alert('Cần tối thiểu 2 lựa chọn cho câu trắc nghiệm.');
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
      alert('Một bài lab Quizlet hỗ trợ tối đa 30 câu hỏi.');
      return;
    }
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: `Câu hỏi ${questions.length + 1}: Nhập nội dung câu hỏi (hỗ trợ Markdown)...`,
      options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
      correctIndex: 0,
      explanation: 'Giải thích vì sao lựa chọn này là chính xác.',
    };
    const nextList = [...questions, newQ];
    onChange(nextList);
    setActiveQuestionIndex(nextList.length - 1);
  };

  const handleDeleteCurrentQuestion = () => {
    if (questions.length <= 1) {
      alert('Cần tối thiểu 1 câu hỏi trong bộ Quizlet.');
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
      const rawBlocks = bulkImportText.split(/(?:^|\n)(?=\d+[\.\)]|##\s*Câu)/).filter(Boolean);
      const parsedList: QuizQuestion[] = [];

      rawBlocks.forEach((block, idx) => {
        const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) return;

        // Prompt line
        const prompt = lines[0].replace(/^\d+[\.\)]\s*|^##\s*Câu\s*\d*[:\.]?\s*/i, '').trim();

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
        alert(`Đã nhập thành công ${parsedList.length} câu hỏi trắc nghiệm!`);
      } else {
        alert('Không tìm thấy câu hỏi hợp lệ trong văn bản. Hãy đảm bảo định dạng đúng (1. Câu hỏi, A. Đáp án A, B. Đáp án B, Đáp án: A).');
      }
    } catch (err: any) {
      alert('Lỗi phân tích cú pháp: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Undo Floating Toast (5s countdown) ─────────────────────── */}
      {deletedBackup && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs text-foreground font-medium">
            Đã xóa câu hỏi #{deletedBackup.index + 1}.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleUndoDelete}
            className="h-7 text-xs font-bold gap-1 bg-primary text-primary-foreground"
          >
            <Undo2 className="size-3" />
            <span>Hoàn tác (5s)</span>
          </Button>
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Soạn Thảo Bộ Trắc Nghiệm Quizlet</h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {questions.length} / 30 CÂU
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mỗi câu hỏi có 2 đến 6 lựa chọn, hỗ trợ định dạng Markdown và xem trước góc nhìn học viên.
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
            <span>Nhập từ Markdown</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAddQuestion}
            disabled={questions.length >= 30}
            className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Thêm câu hỏi ({questions.length}/30)</span>
          </Button>
        </div>
      </div>

      {/* ── Bulk Import Modal ───────────────────────────────────────── */}
      {isBulkImportOpen && (
        <div className="p-5 rounded-2xl border border-primary/30 bg-card shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Nhập hàng loạt câu hỏi từ văn bản Markdown
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBulkImportOpen(false)}
              className="h-6 text-xs text-muted-foreground"
            >
              Đóng
            </Button>
          </div>

          <textarea
            rows={7}
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder={`1. PostgreSQL sử dụng chỉ mục nào làm mặc định cho khóa chính?&#10;A. Hash Index&#10;B. B-Tree Index&#10;C. GiST Index&#10;D. GIN Index&#10;Đáp án: B&#10;Giải thích: B-Tree tối ưu cho tìm kiếm bằng và khoảng.`}
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
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteBulkImport}
              className="text-xs font-bold bg-primary text-primary-foreground"
            >
              Phân tích &amp; Nhập dữ liệu
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
              Danh sách câu hỏi
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {statuses.filter((s) => s === 'ready').length}/{questions.length} Sẵn sàng
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
                      {q.question.replace(/^[#\*\s]+/, '') || `Câu hỏi ${idx + 1}`}
                    </span>
                  </div>

                  {status === 'ready' && (
                    <span title="Đầy đủ thông tin">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </span>
                  )}
                  {status === 'warning' && (
                    <span title="Chưa đủ lựa chọn hoặc chưa chọn đáp án đúng">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                    </span>
                  )}
                  {status === 'empty' && (
                    <span title="Chưa nhập nội dung">
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
            <span>Thêm câu mới</span>
          </Button>
        </div>

        {/* Center Column: Active Question Editor (5 Cols on lg) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Câu hỏi #{activeQuestionIndex + 1}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  statuses[activeQuestionIndex] === 'ready'
                    ? 'border-emerald-500/40 text-emerald-600'
                    : 'border-amber-500/40 text-amber-600'
                }`}
              >
                {statuses[activeQuestionIndex] === 'ready' ? 'Hợp lệ ✓' : 'Chưa hoàn tất ⚠'}
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
                <span>{questionPreviewMode ? 'Sửa' : 'Xem Markdown'}</span>
              </Button>

              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCurrentQuestion}
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
              Nội dung câu hỏi (Markdown) *
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
                placeholder="vd: Cấu trúc nào là mặc định trong PostgreSQL khi tạo `PRIMARY KEY`?"
                className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            )}
          </div>

          {/* Answer choices (2 to 6 options) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Các phương án lựa chọn ({currentQuestion.options.length}/6) *
              </label>
              {currentQuestion.options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-6 text-[11px] px-2 text-primary"
                >
                  + Thêm lựa chọn
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
                      title="Đánh dấu đây là đáp án đúng"
                    />

                    <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                      {String.fromCharCode(65 + optIdx)}
                    </span>

                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 bg-transparent border-0 text-xs text-foreground focus:outline-none font-medium"
                    />

                    {isCorrect && (
                      <Badge className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0 h-4 shrink-0">
                        Đáp án đúng ✓
                      </Badge>
                    )}

                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Xóa lựa chọn này"
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
              Giải thích đáp án (Hiển thị sau khi học viên nộp bài)
            </label>
            <textarea
              rows={2}
              value={currentQuestion.explanation || ''}
              onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
              placeholder="Giải thích vì sao đáp án này là chính xác..."
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Live Student Perspective Preview (4 Cols on lg) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="size-3.5 text-primary" />
              <span>Góc nhìn Học viên (Live Preview)</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              PREVIEW
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Student Card simulation */}
            <div className="p-4 rounded-xl border border-border bg-background space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Câu {activeQuestionIndex + 1} / {questions.length}</span>
                <span className="font-mono">1 Điểm</span>
              </div>

              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground font-medium leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    renderMarkdown(currentQuestion.question) ||
                    '<p class="italic text-muted-foreground">Nhập câu hỏi để xem trước...</p>',
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
                    <span className="text-foreground">{opt || `(Lựa chọn ${String.fromCharCode(65 + i)})`}</span>
                  </div>
                ))}
              </div>

              {currentQuestion.explanation && (
                <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                  <span className="font-bold text-foreground block">💡 Giải thích chi tiết:</span>
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
