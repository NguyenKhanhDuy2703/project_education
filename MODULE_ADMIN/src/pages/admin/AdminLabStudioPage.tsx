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
  ArrowLeft,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import type { CreateLabInput } from '@/types/lab.types';
import { MarkdownEditorWithPreview } from './_components/MarkdownEditorWithPreview';
import { JsWorkerExerciseBuilder } from './_components/JsWorkerExerciseBuilder';
import { SqlExerciseBuilder } from './_components/SqlExerciseBuilder';
import { QuizletExerciseBuilder } from './_components/QuizletExerciseBuilder';

const DRAFT_STORAGE_PREFIX = 'studyweb_lab_draft_';

export function AdminLabStudioPage() {
  const { labId } = useParams<{ labId?: string }>();
  const [searchParams] = useSearchParams();
  const seriesIdFromQuery = searchParams.get('seriesId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditing = !!labId && labId !== 'new';
  const returnUrl = '/admin/content';

  // ── Stepper: Step 1 (Theory & Guidelines) vs Step 2 (Exercise Configuration) ──
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [sqlPreflightPassed, setSqlPreflightPassed] = useState(false);

  // Form State
  const [form, setForm] = useState<CreateLabInput>({
    seriesId: seriesIdFromQuery,
    title: '',
    sandboxType: 'sql_worker',
    objective: '',
    instructions: `# 1. Core Theory

Explain key concepts and prerequisites briefly and visually before starting the exercise.

## 2. Syntax & Examples
\`\`\`sql
SELECT id, full_name FROM customers WHERE total_spent > 1000;
\`\`\`

## 3. Practice Requirements
Write queries or test assertions fulfilling the objectives in the exercise builder below.`,
    initialSnippet: '',
    testScript: '',
    solution: '',
    durationMinutes: 20,
    isProOnly: false,
    orderIndex: 1,
    isActive: true,
    sqlSchema: '',
    expectedQueryResult: [],
    config: {
      version: '2.0',
      schemaSql: '',
      statementPolicy: 'read_only',
      timeoutMs: 3000,
      maxResultRows: 500,
      maxResultColumns: 50,
    },
    quizQuestions: [
      {
        id: 'q1',
        question: 'Question 1: Enter multiple-choice question content (supports Markdown)...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: 'Explanation for why Option A is correct.',
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
        expectedQueryResult: existingLab.expectedQueryResult || [],
        config: {
          version: '2.0',
          schemaSql: existingLab.sqlSchema || '',
          statementPolicy: 'read_only',
          timeoutMs: 3000,
          maxResultRows: 500,
          maxResultColumns: 50,
          ...(existingLab.config || {}),
        },
        quizQuestions:
          existingLab.quizQuestions && existingLab.quizQuestions.length > 0
            ? existingLab.quizQuestions
            : [
                {
                  id: 'q1',
                  question: 'Question 1: Enter question prompt...',
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
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
          if (parsed && parsed.title && window.confirm('Found an unpublished draft from a previous session. Would you like to restore it?')) {
            setForm(parsed);
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        console.error('Failed to read draft:', err);
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
        message: `Draft saved to browser storage at ${nowStr}.`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: 'Unable to save draft to browser storage.', type: 'error' });
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
      const needsVerification = form.config?.statementPolicy === 'mutable';
      const hasVerification = !needsVerification || Boolean(form.config?.verificationSql?.trim());
      hasExerciseConfig = hasSchema && hasSolution && hasVerification && sqlPreflightPassed;
      if (!hasSchema) exerciseReason = 'Missing SQL Schema DDL/DML definition';
      else if (!hasSolution) exerciseReason = 'Missing model SQL solution query';
      else if (!hasVerification) exerciseReason = 'Mutable labs require a hidden verification query';
      else if (!sqlPreflightPassed) exerciseReason = 'Run and pass the PGlite solution preflight';
    } else if (form.sandboxType === 'js_worker') {
      const hasStarter = (form.initialSnippet || '').trim().length >= 10;
      const hasSolution = (form.solution || '').trim().length >= 10;
      const hasTestScript = (form.testScript || '').trim().length >= 10;
      hasExerciseConfig = hasStarter && hasSolution && hasTestScript;
      if (!hasStarter) exerciseReason = 'Missing starter code snippet';
      else if (!hasSolution) exerciseReason = 'Missing reference solution';
      else if (!hasTestScript) exerciseReason = 'Missing evaluation test assertions';
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
      if (questions.length === 0) exerciseReason = 'No quiz questions defined';
      else if (!allValid) exerciseReason = 'Every question must have at least 2 options and a selected correct answer';
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
  }, [form, sqlPreflightPassed]);

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
        setToast({ message: 'Please select a parent Course Series.', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasTitle) {
        setToast({ message: 'Please enter a lab title (minimum 5 characters).', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasTheory) {
        setToast({ message: 'Theory guidelines require a minimum of 100 characters.', type: 'error' });
        setCurrentStep(1);
        return;
      }
      if (!validationChecklist.hasExerciseConfig) {
        setToast({ message: `Step 2 incomplete: ${validationChecklist.exerciseReason}`, type: 'error' });
        setCurrentStep(2);
        return;
      }
    }

    saveMutation.mutate();
  };

  const handleProceedToStep2 = () => {
    if (!form.title.trim()) {
      setToast({ message: 'Please enter a lab title.', type: 'error' });
      return;
    }
    if (!form.seriesId) {
      setToast({ message: 'Please select a parent Course Series.', type: 'error' });
      return;
    }
    if (form.instructions.trim().length < 100) {
      setToast({ message: 'Theory guidelines require a minimum of 100 characters before configuring exercises.', type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  const formatTypeName = {
    sql_worker: 'SQL Database',
    quizlet: 'Quizlet Multiple Choice',
    js_worker: 'JavaScript Worker',
    markdown_only: 'Theory Article',
  }[form.sandboxType || 'sql_worker'];

  if (isEditing && isLoadingLab) {
    return (
      <div className="container mx-auto p-12 text-center text-sm text-muted-foreground">
        Loading practice lab details...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── UNIFIED FIXED TOP HEADER ───────────────────────────────── */}
      <header className="sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 border-b border-border bg-card/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold px-2 gap-1">
            <Link to={returnUrl}>
              <ArrowLeft className="size-3.5" />
              <span>Back to Content</span>
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
              <span>Exercise Builder ({formatTypeName})</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Auto-save status, Save Draft, and Single Publish Button */}
        <div className="flex items-center gap-2.5">
          {lastSavedTime && (
            <span className="text-[11px] text-muted-foreground hidden md:inline flex items-center gap-1">
              <Clock className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>Saved at {lastSavedTime}</span>
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSaveDraft}
            className="h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
          >
            <Save className="size-3.5" />
            <span>Save Draft</span>
          </Button>

          {/* Single Unified Publish / Submit Button with Pre-publish Checklist Gate */}
          {currentStep === 1 ? (
            <Button
              size="sm"
              onClick={handleProceedToStep2}
              className="h-8 text-xs font-bold px-4 gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              <span>Continue to Exercise Builder</span>
              <ChevronRight className="size-3.5" />
            </Button>
          ) : (
            <div className="relative group">
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={saveMutation.isPending || !validationChecklist.isAllValid}
                className={`h-8 text-xs font-bold px-4 gap-1.5 shadow-xs transition-all ${
                  validationChecklist.isAllValid
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                <span>
                  {saveMutation.isPending
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Changes'
                    : 'Publish Lab'}
                </span>
              </Button>

              {/* Tooltip explaining disabled state */}
              {!validationChecklist.isAllValid && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl text-xs z-50 hidden group-hover:block pointer-events-none animate-in fade-in-50">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                    <ShieldAlert className="size-3.5" />
                    <span>Pre-publish Criteria Not Met</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {!validationChecklist.hasSeries && <li>Parent Course Series not selected</li>}
                    {!validationChecklist.hasTitle && <li>Title requires at least 5 characters</li>}
                    {!validationChecklist.hasTheory && <li>Theory requires at least 100 characters</li>}
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
              {toast.type === 'success' ? 'Success' : 'Validation Error'}
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
                title="Expand general settings"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            ) : (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    General Information
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hidden lg:flex"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                </div>

                {/* Series selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Parent Series *
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
                    <option value="">-- Select Parent Series --</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {parentTopic && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>Topic Tag:</span>
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        {parentTopic.category || 'General'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Sandbox format */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Exercise Type *
                  </label>
                  <select
                    value={form.sandboxType}
                    onChange={(e) => setForm({ ...form, sandboxType: e.target.value as any })}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="sql_worker">SQL Database</option>
                    <option value="js_worker">JavaScript Worker</option>
                    <option value="quizlet">Quizlet Multiple Choice</option>
                    <option value="markdown_only">Theory Article</option>
                  </select>
                </div>

                {/* Lab Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Lab Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Filter VIP Customers with SQL WHERE"
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                {/* Duration & Pro */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
                      Duration
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
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-muted-foreground">mins</span>
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
                      <span>PRO Only</span>
                    </label>
                  </div>
                </div>

                {/* ── Live Completion Checklist ───────────────────────── */}
                <div className="pt-3 border-t border-border space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Readiness Checklist
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Parent Series:</span>
                      {validationChecklist.hasSeries ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Selected
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">○ Required</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Title (≥ 5 chars):</span>
                      {validationChecklist.hasTitle ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Valid
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">○ {form.title.trim().length}/5</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Theory (≥ 100 chars):</span>
                      {validationChecklist.hasTheory ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          ✓ Valid
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
              placeholder="# 1. Core Theory...&#10;&#10;## 2. Syntax & Examples...&#10;&#10;## 3. Practice Requirements..."
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
                STEP 2 / 2
              </Badge>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Exercise Configuration: <span className="text-primary">{formatTypeName}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configuring for lab: <strong>"{form.title || 'Untitled Lab'}"</strong>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="h-8 text-xs font-semibold gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Step 1 (Theory)</span>
            </Button>
          </div>

          {/* FORMAT A: SQL DATABASE BUILDER */}
          {form.sandboxType === 'sql_worker' && (
            <SqlExerciseBuilder
              sqlSchema={form.sqlSchema || ''}
              onSqlSchemaChange={(val) => setForm({
                ...form,
                sqlSchema: val,
                config: { ...form.config, version: '2.0', schemaSql: val },
              })}
              initialSnippet={form.initialSnippet || ''}
              onInitialSnippetChange={(val) => setForm({ ...form, initialSnippet: val })}
              solution={form.solution || ''}
              onSolutionChange={(val) => setForm({ ...form, solution: val })}
              sampleData={form.expectedQueryResult || []}
              onSampleDataChange={(val) => setForm({ ...form, expectedQueryResult: val })}
              sqlConfig={form.config}
              onSqlConfigChange={(config) => setForm({ ...form, config: {
                ...config,
                version: '2.0',
                schemaSql: form.sqlSchema || '',
              } })}
              onValidationChange={(_isValid, hasRunPassed) => setSqlPreflightPassed(hasRunPassed)}
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
              <h3 className="text-sm font-bold text-foreground">Theory Reading Mode</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                This mode does not require interactive sandbox execution. Learners complete the lesson by reviewing the theory and guidance in Step 1.
              </p>
            </div>
          )}

          {/* Pre-publish Readiness Status Summary */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Publication Readiness Status
                </span>
                {validationChecklist.isAllValid ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    READY TO PUBLISH ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] font-bold">
                    INCOMPLETE ⚠
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {validationChecklist.isAllValid
                  ? 'All criteria (Theory, Model Solution, and Test Validation) are satisfied and ready for learners.'
                  : `Cannot publish yet: ${validationChecklist.exerciseReason || 'Please complete all required checklist items.'}`}
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
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Publish Lab'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
