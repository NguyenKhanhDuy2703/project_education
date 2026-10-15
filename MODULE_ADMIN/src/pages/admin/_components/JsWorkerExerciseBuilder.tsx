import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Code2,
  Sparkles,
} from 'lucide-react';
import { useLabWorker } from '@/features/lab/hooks/useLabWorker';

export interface TestCaseCard {
  id: string;
  name: string;
  input: string;
  expected: string;
  isHidden?: boolean;
}

interface JsWorkerExerciseBuilderProps {
  initialSnippet: string;
  onInitialSnippetChange: (val: string) => void;
  solution: string;
  onSolutionChange: (val: string) => void;
  testScript: string;
  onTestScriptChange: (val: string) => void;
  onValidationChange?: (isValid: boolean, hasRunPassed: boolean) => void;
}

export function JsWorkerExerciseBuilder({
  initialSnippet,
  onInitialSnippetChange,
  solution,
  onSolutionChange,
  testScript,
  onTestScriptChange,
  onValidationChange,
}: JsWorkerExerciseBuilderProps) {
  const { run, status: runnerStatus, result: runnerResult } = useLabWorker();
  const [editMode, setEditMode] = useState<'cards' | 'raw'>('cards');

  // Parse initial testScript or initialize default cards
  const [testCases, setTestCases] = useState<TestCaseCard[]>(() => {
    if (testScript && testScript.includes('assert(')) {
      const parsed: TestCaseCard[] = [];
      const lines = testScript.split('\n');
      lines.forEach((line, idx) => {
        const match = line.match(/assert\(\s*["']([^"']+)["']\s*,\s*(.+?)\s*===?\s*(.+?)\s*\);?/);
        if (match) {
          parsed.push({
            id: `tc-${idx}-${Date.now()}`,
            name: match[1],
            input: match[2].trim(),
            expected: match[3].trim(),
            isHidden: false,
          });
        }
      });
      if (parsed.length > 0) return parsed;
    }
    return [
      {
        id: 'tc-1',
        name: 'Trường hợp thông thường (Standard input)',
        input: 'solution("hello")',
        expected: '"HELLO"',
        isHidden: false,
      },
      {
        id: 'tc-2',
        name: 'Trường hợp biên (Edge case chuỗi rỗng)',
        input: 'solution("")',
        expected: '""',
        isHidden: true,
      },
    ];
  });

  // Recompile cards into testScript
  useEffect(() => {
    if (editMode === 'cards') {
      const compiled = testCases
        .map((tc) => {
          return `assert("${tc.name.replace(/"/g, '\\"')}", ${tc.input} === ${tc.expected});`;
        })
        .join('\n');
      onTestScriptChange(compiled);
    }
  }, [testCases, editMode, onTestScriptChange]);

  const hasRunPassed = useMemo(() => {
    return !!(runnerResult && runnerResult.passed && runnerResult.testCases.length > 0);
  }, [runnerResult]);

  const isValid = useMemo(() => {
    return (
      initialSnippet.trim().length > 10 &&
      solution.trim().length > 10 &&
      testCases.length > 0 &&
      testCases.every((tc) => tc.name.trim() && tc.input.trim() && tc.expected.trim())
    );
  }, [initialSnippet, solution, testCases]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid, hasRunPassed);
    }
  }, [isValid, hasRunPassed, onValidationChange]);

  const handleAddCard = () => {
    const newIdx = testCases.length + 1;
    setTestCases((prev) => [
      ...prev,
      {
        id: `tc-${Date.now()}`,
        name: `Test case ${newIdx}`,
        input: 'solution(...)',
        expected: '...',
        isHidden: false,
      },
    ]);
  };

  const handleDuplicateCard = (index: number) => {
    const target = testCases[index];
    const duplicated: TestCaseCard = {
      ...target,
      id: `tc-${Date.now()}`,
      name: `${target.name} (Copy)`,
    };
    const nextList = [...testCases];
    nextList.splice(index + 1, 0, duplicated);
    setTestCases(nextList);
  };

  const handleDeleteCard = (index: number) => {
    if (testCases.length <= 1) {
      alert('Bài lab cần tối thiểu 1 test case để kiểm thử tự động.');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCard = (index: number, field: keyof TestCaseCard, val: any) => {
    setTestCases((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Run Solution against Test Cases
  const handleRunTests = () => {
    const currentScript =
      editMode === 'raw'
        ? testScript
        : testCases
            .map((tc) => `assert("${tc.name.replace(/"/g, '\\"')}", ${tc.input} === ${tc.expected});`)
            .join('\n');
    run(solution, currentScript);
  };

  // Fill Smart Default JS Template
  const handleApplyJsTemplate = () => {
    onInitialSnippetChange(`function solution(str) {
  // Viết code xử lý chuỗi ở đây
  return str;
}`);
    onSolutionChange(`function solution(str) {
  if (!str) return "";
  return str.toUpperCase();
}`);
    setTestCases([
      {
        id: 'tc-1',
        name: 'Chuyển chuỗi thường thành hoa',
        input: 'solution("hello")',
        expected: '"HELLO"',
        isHidden: false,
      },
      {
        id: 'tc-2',
        name: 'Xử lý chuỗi rỗng',
        input: 'solution("")',
        expected: '""',
        isHidden: true,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Template Shortcut & Run Test ────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Cấu hình Bài tập JavaScript Worker</h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              In-Browser Sandbox
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cung cấp code khởi đầu cho học viên, các thẻ test case kiểm thử và bài giải mẫu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyJsTemplate}
            className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Mẫu JS chuẩn</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleRunTests}
            disabled={runnerStatus === 'running' || !solution.trim()}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Play className="size-3.5 fill-current" />
            <span>{runnerStatus === 'running' ? 'Đang chạy thử...' : '▶ Chạy thử Solution'}</span>
          </Button>
        </div>
      </div>

      {/* ── Run Feedback Result Banner ──────────────────────────────── */}
      {runnerResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            runnerResult.passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {runnerResult.passed ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {runnerResult.passed ? 'Kết quả: Tất cả test cases đã PASS ✓' : 'Kết quả: Kiểm thử THẤT BẠI ✗'}
                </span>
                <span className="font-mono text-[11px] opacity-75">({runnerResult.timeMs}ms)</span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {runnerResult.passed
                  ? `Solution vượt qua thành công ${runnerResult.testCases.length}/${runnerResult.testCases.length} test cases.`
                  : runnerResult.error ||
                    `Có test case không khớp giá trị mong đợi. Hãy kiểm tra lại giải pháp hoặc test case.`}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-mono font-bold ${
              runnerResult.passed
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {runnerResult.testCases.filter((tc) => tc.passed).length} / {runnerResult.testCases.length} PASS
          </Badge>
        </div>
      )}

      {/* ── 2 Columns: Starter Code vs Solution ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Starter Code (Initial Snippet) */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. Code khởi đầu (Starter Code) *
              </label>
              <p className="text-[11px] text-muted-foreground">
                Hiển thị sẵn trong editor của học viên khi mở bài lab.
              </p>
            </div>
            <Code2 className="size-4 text-muted-foreground" />
          </div>

          <textarea
            rows={7}
            required
            value={initialSnippet}
            onChange={(e) => onInitialSnippetChange(e.target.value)}
            placeholder="function solution(input) {&#10;  // Học viên viết mã xử lý tại đây&#10;  return null;&#10;}"
            className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          />
        </div>

        {/* 2. Reference Solution */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                2. Lời giải mẫu (Reference Solution) *
              </label>
              <p className="text-[11px] text-muted-foreground">
                Dùng để đối chiếu và chạy thử nghiệm ngặt trước khi xuất bản.
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold">
              CHUẨN
            </Badge>
          </div>

          <textarea
            rows={7}
            required
            value={solution}
            onChange={(e) => onSolutionChange(e.target.value)}
            placeholder="function solution(input) {&#10;  // Thuật toán chuẩn hoàn chỉnh&#10;  return result;&#10;}"
            className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          />
        </div>
      </div>

      {/* ── 3. Test Cases List as Cards ─────────────────────────────── */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. Danh sách Test Cases kiểm thử ({testCases.length})
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono">
                Auto Assert
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hệ thống sẽ tự động đối chiếu kết quả của <code className="text-primary font-mono">Input === Expected</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(editMode === 'cards' ? 'raw' : 'cards')}
              className="h-7 text-xs px-2 text-muted-foreground"
            >
              {editMode === 'cards' ? 'Xem Script Raw' : 'Chuyển về Dạng Thẻ'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCard}
              className="h-7 text-xs font-bold gap-1"
            >
              <Plus className="size-3.5" />
              <span>Thêm Test Case</span>
            </Button>
          </div>
        </div>

        {editMode === 'raw' ? (
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Script kiểm thử tùy chỉnh (assert)
            </label>
            <textarea
              rows={8}
              value={testScript}
              onChange={(e) => onTestScriptChange(e.target.value)}
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc, index) => {
              const testResult = runnerResult?.testCases?.find((r) => r.name === tc.name);
              return (
                <div
                  key={tc.id || index}
                  className="p-3.5 rounded-xl border border-border bg-background/60 hover:bg-background transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="size-5 rounded-md bg-muted text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={tc.name}
                        onChange={(e) => handleUpdateCard(index, 'name', e.target.value)}
                        placeholder="Mô tả test case (vd: Chuỗi chứa ký tự đặc biệt)"
                        className="flex-1 bg-transparent border-0 text-xs font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {testResult && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold gap-1 ${
                            testResult.passed
                              ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5'
                              : 'border-rose-500/40 text-rose-600 bg-rose-500/5'
                          }`}
                        >
                          {testResult.passed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                          <span>{testResult.passed ? 'PASS' : 'FAIL'}</span>
                        </Badge>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateCard(index, 'isHidden', !tc.isHidden)}
                        className={`h-7 px-2 text-[11px] gap-1 ${
                          tc.isHidden ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                        }`}
                        title={tc.isHidden ? 'Test case ẩn (dùng khi chấm điểm)' : 'Test case công khai cho học viên'}
                      >
                        {tc.isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        <span>{tc.isHidden ? 'Ẩn' : 'Hiện'}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateCard(index)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Nhân bản test case này"
                      >
                        <Copy className="size-3" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(index)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Xóa test case"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Input Expression (Gọi hàm) *
                      </span>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => handleUpdateCard(index, 'input', e.target.value)}
                        placeholder='vd: solution("abc")'
                        className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Expected Value (Giá trị mong đợi) *
                      </span>
                      <input
                        type="text"
                        value={tc.expected}
                        onChange={(e) => handleUpdateCard(index, 'expected', e.target.value)}
                        placeholder='vd: "ABC" hoặc true'
                        className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
