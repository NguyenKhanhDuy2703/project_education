/**
 * AdminLabStudioPage — /admin/labs/new hoặc /admin/labs/:labId/edit
 * Also mounted at /contributor/labs/new and /contributor/labs/:labId/edit
 *
 * Trình tạo bài thực hành thông minh (Practice Lab Creation Studio):
 * - BƯỚC 1: Theory & Guidelines (Bố cục 2 cột: Cột trái hẹp 280px thông tin chung & checklist, Cột phải Split 50/50 Markdown + Live Preview cuộn đồng bộ)
 * - BƯỚC 2: Cấu hình bài tập theo bản chất từng loại (JS Worker với test cards & Web Worker runner, SQL với Schema DDL, Starter Query, Test Grid sinh tự động, Quizlet 3 cột với live student preview & undo)
 * - Header cố định duy nhất 1 nút Publish / Gửi duyệt với Cổng kiểm duyệt Pre-publish Checklist Gate.
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  ChevronLeft,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import type { CreateLabInput } from '@/types/lab.types';
import { MarkdownEditorWithPreview } from './_components/MarkdownEditorWithPreview';
import { JsWorkerExerciseBuilder } from './_components/JsWorkerExerciseBuilder';
import { SqlExerciseBuilder } from './_components/SqlExerciseBuilder';
import { QuizletExerciseBuilder } from './_components/QuizletExerciseBuilder';

const DRAFT_STORAGE_PREFIX = 'studyweb_lab_draft_';

export function LabStudioPage() {
  const { labId } = useParams<{ labId?: string }>();
  const [searchParams] = useSearchParams();
  const seriesIdFromQuery = searchParams.get('seriesId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditing = !!labId && labId !== 'new';
  const returnUrl = '/user/dashboard/content';
  const isContributor = true;

  // ── Stepper: Step 1 (Theory & Guidelines) vs Step 2 (Exercise Configuration) ──
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<CreateLabInput>({
    seriesId: seriesIdFromQuery,
    title: '',
    sandboxType: 'sql_worker',
    objective: '',
    instructions: `# 1. Lý thuyết Cốt lõi

Giải thích ngắn gọn và trực quan các khái niệm cần nắm vững trước khi thực hành.

## 2. Cú pháp & Ví dụ Mẫu
\`\`\`sql
SELECT id, full_name FROM customers WHERE total_spent > 1000;
\`\`\`

## 3. Yêu cầu Bài Thực hành
Viết câu truy vấn hoặc mã lệnh đáp ứng đầy đủ các tiêu chí trong phần bài tập.`,
    initialSnippet: '',
    testScript: '',
    solution: '',
    durationMinutes: 20,
    isProOnly: false,
    orderIndex: 1,
    isActive: true,
    sqlSchema: '',
    sampleData: [],
    quizQuestions: [
      {
        id: 'q1',
        question: 'Câu hỏi 1: Nhập nội dung câu hỏi trắc nghiệm (hỗ trợ `Markdown`)...',
        options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
        correctIndex: 0,
        explanation: 'Giải thích vì sao lựa chọn A là chính xác.',
      },
    ],
  });

  // Fetch Series list for parent dropdown
  const { data: seriesList = [] } = useQuery({
    queryKey: ['admin-series'],
    queryFn: () => seriesApi.getAll(true),
  });

  // If editing, fetch lab detail
  const { data: existingLab, isLoading: isLoadingLab } = useQuery({
    queryKey: ['admin-lab-detail', labId],
    queryFn: () => labApi.getById(labId!),
    enabled: isEditing,
  });

  // Load existing lab data
  useEffect(() => {
    if (existingLab) {
      const labAny = existingLab as any;
      setForm({
        seriesId: existingLab.seriesId || '',
        title: existingLab.title || '',
        sandboxType: existingLab.sandboxType || 'sql_worker',
        objective: labAny.objective || '',
        instructions: existingLab.instructions || '',
        initialSnippet: existingLab.initialSnippet || '',
        testScript: existingLab.testScript || '',
        solution: existingLab.solution || '',
        durationMinutes: existingLab.estimatedMinutes || labAny.durationMinutes || 20,
        isProOnly: existingLab.isProOnly || false,
        orderIndex: existingLab.order || labAny.orderIndex || 1,
        isActive: labAny.isActive !== false,
        sqlSchema: existingLab.sqlSchema || '',
        sampleData: existingLab.sampleData || [],
        quizQuestions:
          existingLab.quizQuestions && existingLab.quizQuestions.length > 0
            ? existingLab.quizQuestions
            : [
                {
                  id: 'q1',
                  question: 'Câu hỏi 1: Nhập nội dung câu hỏi...',
                  options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
                  correctIndex: 0,
                  explanation: '',
                },
              ],
      });
    } else if (seriesIdFromQuery && !form.seriesId) {
      setForm((prev) => ({ ...prev, seriesId: seriesIdFromQuery }));
    }
  }, [existingLab, seriesIdFromQuery]);

  // Inherit format from parent series if creating new
  const selectedSeriesId = form.seriesId || seriesIdFromQuery;
  const parentTopic = seriesList.find((s) => s.id === selectedSeriesId);

  useEffect(() => {
    if (parentTopic && !isEditing) {
      const topicFormat =
        parentTopic.formatType ||
        (parentTopic.slug.includes('sql')
          ? 'sql_worker'
          : parentTopic.slug.includes('quiz')
          ? 'quizlet'
          : 'js_worker');
      setForm((prev) => ({
        ...prev,
        seriesId: parentTopic.id,
        sandboxType: topicFormat,
      }));
    }
  }, [parentTopic?.id, parentTopic?.formatType, isEditing]);

  // ── Auto-save Draft to localStorage ─────────────────────────────────────
  const draftKey = `${DRAFT_STORAGE_PREFIX}${labId || 'new'}`;

  // Check and restore draft for new lab
  useEffect(() => {
    if (!isEditing) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.title && window.confirm('Tìm thấy bản nháp chưa xuất bản từ phiên làm việc trước. Bạn có muốn khôi phục không?')) {
            setForm(parsed);
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        console.error('Lỗi đọc bản nháp:', err);
      }
    }
  }, [isEditing, draftKey]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        // quota exceeded or private mode
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, draftKey]);

  // Explicit save draft button
  const handleManualSaveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(nowStr);
      setToast({
        message: `Đã lưu bản nháp vào bộ nhớ trình duyệt lúc ${nowStr}.`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: 'Không thể lưu bản nháp vào trình duyệt.', type: 'error' });
    }
  };

  // ── Pre-publish Validation Checklist ────────────────────────────────────
  const validationChecklist = useMemo(() => {
    const hasSeries = Boolean(form.seriesId);
    const hasTitle = form.title.trim().length >= 5;
    const hasTheory = form.instructions.trim().length >= 100;

    let hasExerciseConfig = false;
    let exerciseReason = '';

    if (form.sandboxType === 'sql_worker') {
      const hasSchema = (form.sqlSchema || '').trim().length >= 20;
      const hasSolution = (form.solution || '').trim().length >= 10;
      hasExerciseConfig = hasSchema && hasSolution;
      if (!hasSchema) exerciseReason = 'Thiếu Lược đồ DDL/DML bảng';
      else if (!hasSolution) exerciseReason = 'Thiếu câu truy vấn Solution mẫu';
    } else if (form.sandboxType === 'js_worker') {
      const hasStarter = (form.initialSnippet || '').trim().length >= 10;
      const hasSolution = (form.solution || '').trim().length >= 10;
      const hasTestScript = (form.testScript || '').trim().length >= 10;
      hasExerciseConfig = hasStarter && hasSolution && hasTestScript;
      if (!hasStarter) exerciseReason = 'Thiếu Starter Code cho học viên';
      else if (!hasSolution) exerciseReason = 'Thiếu Reference Solution';
      else if (!hasTestScript) exerciseReason = 'Thiếu Test cases kiểm thử';
    } else if (form.sandboxType === 'quizlet') {
      const questions = form.quizQuestions || [];
      const allValid =
        questions.length > 0 &&
        questions.every(
          (q) =>
            q.question.trim().length > 5 &&
            q.options.length >= 2 &&
            q.options.every((opt) => opt.trim().length > 0) &&
            q.correctIndex >= 0 &&
            q.correctIndex < q.options.length
        );
      hasExerciseConfig = allValid;
      if (questions.length === 0) exerciseReason = 'Chưa có câu hỏi trắc nghiệm';
      else if (!allValid) exerciseReason = 'Có câu hỏi chưa đủ 2 đáp án hoặc chưa chọn đáp án đúng';
    } else {
      hasExerciseConfig = true; // article only
    }

    const isAllValid = hasSeries && hasTitle && hasTheory && hasExerciseConfig;

    return {
      hasSeries,
      hasTitle,
      hasTheory,
      hasExerciseConfig,
      exerciseReason,
      isAllValid,
    };
  }, [form]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: () => {
      if (isEditing) {
        return labApi.update(labId!, form);
      }
      return labApi.create(form);
    },
    onSuccess: () => {
      // Clear draft on publish
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-series'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-labs'] });

      setToast({
        message: isEditing ? 'Practice lab updated successfully!' : 'Practice lab published successfully!',
        type: 'success',
      });
      setTimeout(() => {
        navigate(returnUrl);
      }, 1200);
    },
    onError: (err: any) => {
      setToast({
        message: err?.response?.data?.message || 'An error occurred while saving the practice lab.',
        type: 'error',
      });
    },
  });

  const handlePublish = () => {
    if (!validationChecklist.isAllValid) {
      if (!validationChecklist.hasSeries) {
        setToast({ message: 'Please select a parent curriculum series.', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasTitle) {
        setToast({ message: 'Please enter a lab title (minimum 5 characters).', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasTheory) {
        setToast({ message: 'Theory content requires at least 100 characters.', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasExerciseConfig) {
        setToast({ message: `Incomplete Step 2: ${validationChecklist.exerciseReason}`, type: 'error' });
        setCurrentStep(2);
        return;
      }
    }

    saveMutation.mutate();
  };

  const handleProceedToStep2 = () => {
    if (!form.title.trim()) {
      setToast({ message: 'Vui lòng nhập Tiêu đề bài lab.', type: 'error' });
      return;
    }
    if (!form.seriesId) {
      setToast({ message: 'Vui lòng chọn Chuyên đề / Series cha.', type: 'error' });
      return;
    }
    if (form.instructions.trim().length < 100) {
      setToast({ message: 'Nội dung Lý thuyết cần tối thiểu 100 ký tự trước khi cấu hình bài tập.', type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  const formatTypeName = {
    sql_worker: 'SQL Database',
    quizlet: 'Trắc nghiệm Quizlet',
    js_worker: 'JavaScript Worker',
    markdown_only: 'Bài đọc Lý thuyết',
  }[form.sandboxType || 'sql_worker'];

  if (isEditing && isLoadingLab) {
    return (
      <div className="container mx-auto p-12 text-center text-sm text-muted-foreground">
        Đang tải thông tin bài thực hành...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── UNIFIED FIXED TOP HEADER ───────────────────────────────── */}
      <header className="sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 border-b border-border bg-card/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold px-2 text-muted-foreground hover:text-foreground">
            <Link to={returnUrl}>
              Back to Content Hub
            </Link>
          </Button>

          <span className="text-muted-foreground/30 font-mono text-xs hidden sm:inline">|</span>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-0.5 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentStep === 1
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-mono">
                1
              </span>
              <span>Theory &amp; Guidelines</span>
            </button>

            <span className="text-muted-foreground/40 font-mono text-xs">→</span>

            <button
              type="button"
              onClick={handleProceedToStep2}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentStep === 2
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-mono">
                2
              </span>
              <span>Exercise ({formatTypeName})</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Auto-save status, Save Draft, and Single Publish Button */}
        <div className="flex items-center gap-2.5">
          {lastSavedTime && (
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Saved {lastSavedTime}
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSaveDraft}
            className="h-8 text-xs font-medium px-3 text-muted-foreground hover:text-foreground"
          >
            Save Draft
          </Button>

          {/* Single Unified Publish / Submit Button with Pre-publish Checklist Gate */}
          {currentStep === 1 ? (
            <Button
              size="sm"
              onClick={handleProceedToStep2}
              className="h-8 text-xs font-bold px-4 bg-primary text-primary-foreground shadow-xs"
            >
              Continue to Exercise
            </Button>
          ) : (
            <div className="relative group">
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={saveMutation.isPending || !validationChecklist.isAllValid}
                className={`h-8 text-xs font-bold px-4 shadow-xs transition-all ${
                  validationChecklist.isAllValid
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                }`}
              >
                <span>
                  {saveMutation.isPending
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Changes'
                    : isContributor
                    ? 'Submit for Review'
                    : 'Publish Lab'}
                </span>
              </Button>

              {/* Tooltip explaining disabled state */}
              {!validationChecklist.isAllValid && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl text-xs z-50 hidden group-hover:block pointer-events-none animate-in fade-in-50">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                    <ShieldAlert className="size-3.5" />
                    <span>Chưa đủ điều kiện xuất bản</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {!validationChecklist.hasSeries && <li>Chưa chọn Chuyên đề (Series)</li>}
                    {!validationChecklist.hasTitle && <li>Tiêu đề cần tối thiểu 5 ký tự</li>}
                    {!validationChecklist.hasTheory && <li>Lý thuyết cần tối thiểu 100 ký tự</li>}
                    {!validationChecklist.hasExerciseConfig && <li>{validationChecklist.exerciseReason}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-14 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-2">
          <Alert variant={toast.type === 'error' ? 'destructive' : 'default'} className="bg-card shadow-lg border">
            <AlertTitle className="text-xs font-bold">
              {toast.type === 'success' ? 'Thành công' : 'Lỗi kiểm tra'}
            </AlertTitle>
            <AlertDescription className="text-xs mt-0.5">
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── STEP 1: THEORY & GUIDELINES (BỐ CỤC 2 CỘT CHIA ĐÔI) ───────────── */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full items-start">
          {/* Cột trái hẹp (~280px, collapsible): Thông tin chung & Checklist */}
          <div
            className={`transition-all duration-200 shrink-0 ${
              isSidebarCollapsed ? 'w-full lg:w-12' : 'w-full lg:w-[280px]'
            }`}
          >
            {isSidebarCollapsed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-full h-10 p-0 text-muted-foreground hover:text-foreground"
                title="Mở rộng cột thông tin chung"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            ) : (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Thông tin Chung
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hidden lg:flex"
                    title="Thu gọn cột"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                </div>

                {/* Series selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Chuyên đề (Series) *
                  </label>
                  <select
                    required
                    value={form.seriesId}
                    onChange={(e) => {
                      const nextTopic = seriesList.find((s) => s.id === e.target.value);
                      const nextFormat =
                        nextTopic?.formatType ||
                        (nextTopic?.slug.includes('sql')
                          ? 'sql_worker'
                          : nextTopic?.slug.includes('quiz')
                          ? 'quizlet'
                          : 'js_worker');
                      setForm({
                        ...form,
                        seriesId: e.target.value,
                        sandboxType: nextFormat || form.sandboxType,
                      });
                    }}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="">-- Chọn Series cha --</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {parentTopic && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>Thuộc thẻ:</span>
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        🏷️ {parentTopic.category || 'General'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Sandbox format */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Loại hình bài tập *
                  </label>
                  <select
                    value={form.sandboxType}
                    onChange={(e) => setForm({ ...form, sandboxType: e.target.value as any })}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="sql_worker">SQL Database</option>
                    <option value="js_worker">JavaScript Worker</option>
                    <option value="quizlet">Trắc nghiệm Quizlet</option>
                    <option value="markdown_only">Bài đọc Lý thuyết</option>
                  </select>
                </div>

                {/* Lab Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Tiêu đề bài Lab *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="vd: Lọc khách hàng VIP bằng SQL WHERE"
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                {/* Duration & Pro */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
                      Thời lượng
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) =>
                          setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 20 })
                        }
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-muted-foreground">phút</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                      <input
                        type="checkbox"
                        checked={form.isProOnly}
                        onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
                        className="rounded text-primary focus:ring-primary size-3.5"
                      />
                      <span>Gói PRO</span>
                    </label>
                  </div>
                </div>

                {/* ── Live Completion Checklist ───────────────────────── */}
                <div className="pt-3 border-t border-border space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Tiêu chuẩn hoàn tất (Checklist)
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Series cha:</span>
                      {validationChecklist.hasSeries ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Đã chọn
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">○ Chưa chọn</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tiêu đề (≥ 5 ký tự):</span>
                      {validationChecklist.hasTitle ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">○ {form.title.trim().length}/5</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lý thuyết (≥ 100 ký tự):</span>
                      {validationChecklist.hasTheory ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          ○ {form.instructions.trim().length}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Split view 50/50 Markdown Editor & Live Preview với toolbar */}
          <div className="flex-1 min-w-0 w-full">
            <MarkdownEditorWithPreview
              value={form.instructions}
              onChange={(val) => setForm({ ...form, instructions: val })}
              sandboxType={form.sandboxType}
              minHeight="540px"
              placeholder="# 1. Lý thuyết cốt lõi...&#10;&#10;## 2. Cú pháp & Ví dụ...&#10;&#10;## 3. Yêu cầu bài tập..."
            />
          </div>
        </div>
      )}

      {/* ── STEP 2: CONFIGURE EXERCISE BY SANDBOX TYPE ────────────────────── */}
      {currentStep === 2 && (
        <div className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Active Type Banner */}
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs font-bold">
                BƯỚC 2 / 2
              </Badge>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Cấu hình Bài tập: <span className="text-primary">{formatTypeName}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Đang thiết lập cho bài lab: <strong>"{form.title || 'Chưa đặt tiêu đề'}"</strong>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="h-8 text-xs font-semibold px-3"
            >
              Back to Step 1 (Theory)
            </Button>
          </div>

          {/* FORMAT A: SQL DATABASE BUILDER */}
          {form.sandboxType === 'sql_worker' && (
            <SqlExerciseBuilder
              sqlSchema={form.sqlSchema || ''}
              onSqlSchemaChange={(val) => setForm({ ...form, sqlSchema: val })}
              initialSnippet={form.initialSnippet || ''}
              onInitialSnippetChange={(val) => setForm({ ...form, initialSnippet: val })}
              solution={form.solution || ''}
              onSolutionChange={(val) => setForm({ ...form, solution: val })}
              sampleData={form.sampleData || []}
              onSampleDataChange={(val) => setForm({ ...form, sampleData: val })}
            />
          )}

          {/* FORMAT B: JAVASCRIPT WORKER BUILDER */}
          {form.sandboxType === 'js_worker' && (
            <JsWorkerExerciseBuilder
              initialSnippet={form.initialSnippet || ''}
              onInitialSnippetChange={(val) => setForm({ ...form, initialSnippet: val })}
              solution={form.solution || ''}
              onSolutionChange={(val) => setForm({ ...form, solution: val })}
              testScript={form.testScript || ''}
              onTestScriptChange={(val) => setForm({ ...form, testScript: val })}
            />
          )}

          {/* FORMAT C: QUIZLET MULTI-QUESTION BUILDER */}
          {form.sandboxType === 'quizlet' && (
            <QuizletExerciseBuilder
              questions={form.quizQuestions || []}
              onChange={(nextQuestions) => setForm({ ...form, quizQuestions: nextQuestions })}
            />
          )}

          {/* FORMAT D: MARKDOWN ONLY (BLOG / THEORY) */}
          {form.sandboxType === 'markdown_only' && (
            <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-2">
              <h3 className="text-sm font-bold text-foreground">Chế độ Bài đọc Lý thuyết</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Thể loại này không yêu cầu cấu hình bài tập thực hành. Học viên sẽ đọc nội dung lý thuyết ở Bước 1 và đánh dấu hoàn thành bài học.
              </p>
            </div>
          )}

          {/* Pre-publish Readiness Status Summary */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Trạng thái Kiểm duyệt Xuất bản
                </span>
                {validationChecklist.isAllValid ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    SẴN SÀNG XUẤT BẢN ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] font-bold">
                    CẦN BỔ SUNG THÔNG TIN ⚠
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {validationChecklist.isAllValid
                  ? 'Tất cả tiêu chuẩn (Lý thuyết, Lời giải mẫu, Bộ test cases) đã hoàn tất và sẵn sàng phục vụ học viên.'
                  : `Chưa thể xuất bản: ${validationChecklist.exerciseReason || 'Vui lòng hoàn tất đầy đủ các mục kiểm tra.'}`}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saveMutation.isPending || !validationChecklist.isAllValid}
              className={`h-9 text-xs font-bold px-5 gap-1.5 shadow-xs shrink-0 ${
                validationChecklist.isAllValid
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
              }`}
            >
              <CheckCircle2 className="size-4" />
              <span>
                {saveMutation.isPending
                  ? 'Đang lưu...'
                  : isEditing
                  ? 'Lưu thay đổi'
                  : isContributor
                  ? 'Gửi duyệt bài lab'
                  : 'Xuất bản bài lab'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
