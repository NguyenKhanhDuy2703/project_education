/**
 * LabStudioPage — /admin/labs/new hoặc /admin/labs/:labId/edit
 * Also mounted at /contributor/labs/new and /contributor/labs/:labId/edit
 *
 * Studio Thiết kế & Soạn thảo Bài Thực hành Thông minh (Lab Creation Studio):
 * - TAB 1: Soạn thảo (Editor)
 *   + Cột trái (~280px): Cấu hình bài lab (Series, Loại bài tập, Tiêu đề, Thời lượng, PRO, Điều kiện xuất bản).
 *   + Cột chính:
 *     * Phần 1: Lý thuyết & Hướng dẫn học viên (Markdown thuần túy với thanh công cụ định dạng nhanh đầy đủ).
 *     * Phần 2: Cấu hình Bài tập thực hành chuyên biệt (SQL Schema/Starter/Solution, JS Worker Starter/Solution/Tests, hoặc Quizlet).
 * - TAB 2: Xem trước học viên (Student Preview)
 *   + Hiển thị toàn màn hình không gian mô phỏng phòng lab học viên (Theory Pane + Practice Workspace).
 * - Header tối giản, tinh giản icon rườm rà, các nút bấm chuẩn phẳng, hỗ trợ kiểm thử Preflight trước khi gửi duyệt.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { CreateLabInput, SandboxType, LabContentEnvelopeV1 } from '@/types/lab.types';
import { SmartLabToolbar } from '@/features/lab/components/SmartLabToolbar';
import { StudioStudentPreview } from './_components/StudioStudentPreview';
import { SqlExerciseBuilder } from './_components/SqlExerciseBuilder';
import { JsWorkerExerciseBuilder } from './_components/JsWorkerExerciseBuilder';
import { QuizletExerciseBuilder } from './_components/QuizletExerciseBuilder';
import { parseLabMarkdown, serializeLabMarkdown } from '@/features/lab/utils/lab-markdown-parser';
import { normalizeLabDetail } from '@/features/lab/domain/labContentCodec';
import {
  getStudioDraftStorageKey,
  saveStudioDraft,
  loadStudioDraft,
  clearStudioDraft,
} from '@/features/lab/utils/studioDraftStorage';

const DEFAULT_THEORY_TEMPLATE = `# 1. Core Theory

Briefly and visually explain key concepts learners need to understand before practicing.

## 2. Syntax & Examples
Provide basic syntax and illustrative code examples.

## 3. Practice Requirements
Specify the exact learning objectives and expected outcome for the exercise below.`;

export function LabStudioPage() {
  const { labId } = useParams<{ labId?: string }>();
  const [searchParams] = useSearchParams();
  const seriesIdFromQuery = searchParams.get('seriesId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditing = !!labId && labId !== 'new';
  const returnUrl = '/user/dashboard/content';
  const isContributor = true;

  // 2 Primary Tabs: 'editor' | 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [preflightPassed, setPreflightPassed] = useState<boolean>(false);

  const theoryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Form State: Theory and Exercise are cleanly decoupled
  const [form, setForm] = useState<CreateLabInput>({
    seriesId: seriesIdFromQuery,
    title: '',
    sandboxType: 'sql_worker',
    objective: '',
    instructions: DEFAULT_THEORY_TEMPLATE,
    initialSnippet: 'SELECT * FROM customers;',
    testScript: '',
    solution: 'SELECT id, full_name FROM customers WHERE total_spent > 1000;',
    durationMinutes: 20,
    isProOnly: false,
    orderIndex: 1,
    isActive: true,
    sqlSchema: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  full_name TEXT,
  total_spent INT
);

INSERT INTO customers VALUES 
  (1, 'Alice', 1200), 
  (2, 'Bob', 450);`,
    sampleData: [],
    quizQuestions: [
      {
        id: 'q1',
        question: 'Question 1: Which of the following statements is correct?',
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
      const normalized = normalizeLabDetail(existingLab);
      const env = normalized.envelope;
      setForm({
        seriesId: existingLab.seriesId || '',
        title: existingLab.title || '',
        sandboxType: existingLab.sandboxType || 'sql_worker',
        objective: labAny.objective || '',
        instructions: env?.instructions || existingLab.instructions || DEFAULT_THEORY_TEMPLATE,
        initialSnippet: env?.initialSnippet || existingLab.initialSnippet || '',
        testScript: env?.testScript || existingLab.testScript || '',
        solution: env?.solution || existingLab.solution || '',
        durationMinutes: existingLab.estimatedMinutes || labAny.durationMinutes || 20,
        isProOnly: existingLab.isProOnly || false,
        orderIndex: existingLab.order || labAny.orderIndex || 1,
        isActive: labAny.isActive !== false,
        sqlSchema:
          env?.sandboxType === 'sql_worker'
            ? env.config?.schemaSql || existingLab.sqlSchema || ''
            : existingLab.sqlSchema || '',
        sampleData:
          env?.sandboxType === 'sql_worker'
            ? (env.config?.expectedQueryResult as any) || existingLab.sampleData || []
            : existingLab.sampleData || [],
        quizQuestions:
          env?.sandboxType === 'quizlet' && env.config?.questions?.length
            ? env.config.questions
            : existingLab.quizQuestions && existingLab.quizQuestions.length > 0
            ? existingLab.quizQuestions
            : [
                {
                  id: 'q1',
                  question: 'Question 1: Enter question text here...',
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
    if (parentTopic && !isEditing && !form.title) {
      const topicFormat =
        parentTopic.formatType ||
        (parentTopic.slug.includes('sql')
          ? 'sql_worker'
          : parentTopic.slug.includes('quiz')
          ? 'quizlet'
          : 'js_worker');
      handleSandboxTypeChange(topicFormat as SandboxType);
    }
  }, [parentTopic?.id, parentTopic?.formatType, isEditing]);

  // Derived Preview Envelope
  const previewEnvelope = useMemo<LabContentEnvelopeV1>(() => {
    if (form.sandboxType === 'js_worker') {
      return {
        version: '1.0',
        sandboxType: 'js_worker',
        instructions: form.instructions || '',
        initialSnippet: form.initialSnippet || '',
        solution: form.solution || '',
        testScript: form.testScript || '',
        config: {
          version: '1.0',
        },
      };
    } else if (form.sandboxType === 'quizlet') {
      return {
        version: '1.0',
        sandboxType: 'quizlet',
        instructions: form.instructions || '',
        config: {
          version: '1.0',
          questions: (form.quizQuestions || []) as any,
        },
      };
    } else {
      return {
        version: '1.0',
        sandboxType: 'sql_worker',
        instructions: form.instructions || '',
        initialSnippet: form.initialSnippet || '',
        solution: form.solution || '',
        config: {
          version: '1.0',
          schemaSql: form.sqlSchema || '',
          expectedQueryResult: (form.sampleData || []) as any,
        },
      };
    }
  }, [form]);

  // ── Auto-save Draft with studioDraftStorage ─────────────────────────────
  const draftKey = getStudioDraftStorageKey(form.seriesId, labId);

  // Restore draft for new lab
  useEffect(() => {
    if (!isEditing) {
      try {
        const savedDraft = loadStudioDraft(draftKey);
        if (
          savedDraft &&
          savedDraft.title &&
          window.confirm('Found an unpublished draft from a previous session. Would you like to restore it?')
        ) {
          const parsed = parseLabMarkdown(savedDraft.markdown, savedDraft.sandboxType as SandboxType);
          const env = parsed.envelope;
          setForm((prev) => ({
            ...prev,
            title: savedDraft.title,
            sandboxType: (savedDraft.sandboxType as SandboxType) || 'sql_worker',
            isProOnly: savedDraft.isProOnly,
            durationMinutes: savedDraft.durationMinutes,
            instructions: env.instructions || prev.instructions,
            initialSnippet: env.initialSnippet || prev.initialSnippet,
            solution: env.solution || prev.solution,
            testScript: env.testScript || prev.testScript,
            sqlSchema: env.sandboxType === 'sql_worker' ? env.config.schemaSql : prev.sqlSchema,
            sampleData: env.sandboxType === 'sql_worker' ? (env.config.expectedQueryResult as any) : prev.sampleData,
            quizQuestions: env.sandboxType === 'quizlet' ? env.config.questions : prev.quizQuestions,
          }));
          setLastSavedTime(new Date(savedDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Error restoring studio draft:', err);
      }
    }
  }, [isEditing, draftKey]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const md = serializeLabMarkdown(previewEnvelope);
        saveStudioDraft(draftKey, {
          title: form.title,
          markdown: md,
          sandboxType: form.sandboxType || 'sql_worker',
          isProOnly: Boolean(form.isProOnly),
          durationMinutes: form.durationMinutes || 20,
          savedAt: new Date().toISOString(),
        });
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Error auto-saving draft:', e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, previewEnvelope, draftKey]);

  // Explicit save draft button
  const handleManualSaveDraft = () => {
    try {
      const md = serializeLabMarkdown(previewEnvelope);
      const success = saveStudioDraft(draftKey, {
        title: form.title,
        markdown: md,
        sandboxType: form.sandboxType || 'sql_worker',
        isProOnly: Boolean(form.isProOnly),
        durationMinutes: form.durationMinutes || 20,
        savedAt: new Date().toISOString(),
      });
      if (success) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(nowStr);
        setToast({
          message: `Draft saved to browser storage at ${nowStr}.`,
          type: 'success',
        });
      } else {
        setToast({ message: 'Unable to save draft to browser storage.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Error saving draft.', type: 'error' });
    }
  };

  // Switch Sandbox Type & init clean defaults
  const handleSandboxTypeChange = (nextType: SandboxType) => {
    setForm((prev) => {
      const updated = { ...prev, sandboxType: nextType };
      if (nextType === 'sql_worker' && (!prev.sqlSchema || prev.sqlSchema.trim().length < 10)) {
        updated.sqlSchema = `CREATE TABLE customers (\n  id INT PRIMARY KEY,\n  full_name TEXT,\n  total_spent INT\n);\n\nINSERT INTO customers VALUES \n  (1, 'Alice', 1200), \n  (2, 'Bob', 450);`;
        updated.initialSnippet = `SELECT * FROM customers;`;
        updated.solution = `SELECT id, full_name FROM customers WHERE total_spent > 1000;`;
      } else if (nextType === 'js_worker' && (!prev.initialSnippet || prev.initialSnippet.trim().length < 10)) {
        updated.initialSnippet = `function solution(a, b) {\n  // Write your code here\n}`;
        updated.solution = `function solution(a, b) {\n  return a + b;\n}`;
        updated.testScript = `test('calculates sum of two numbers', () => {\n  expect(solution(1, 2)).toBe(3);\n});`;
      } else if (nextType === 'quizlet' && (!prev.quizQuestions || prev.quizQuestions.length === 0)) {
        updated.quizQuestions = [
          {
            id: 'q1',
            question: 'Question 1: Which of the following statements is correct?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: 0,
            explanation: 'Explanation for why Option A is correct.',
          },
        ];
      }
      return updated;
    });
    setPreflightPassed(false);
  };

  // Quick insertion into Theory textarea
  const handleInsertTheorySnippet = (snippet: string) => {
    const textarea = theoryTextareaRef.current;
    if (!textarea) {
      setForm((prev) => ({
        ...prev,
        instructions: `${prev.instructions}\n${snippet}`,
      }));
      setPreflightPassed(false);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.instructions || '';
    const next = current.substring(0, start) + snippet + current.substring(end);
    setForm((prev) => ({ ...prev, instructions: next }));
    setPreflightPassed(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // ── Preflight Gate Handler ───────────────────────────────────────────────
  const handleRunPreflight = () => {
    if (!form.title.trim() || form.title.trim().length < 5) {
      setToast({ message: 'Preflight: Lab title must be at least 5 characters.', type: 'error' });
      setPreflightPassed(false);
      return;
    }
    if (!form.seriesId) {
      setToast({ message: 'Preflight: Please select a parent Series.', type: 'error' });
      setPreflightPassed(false);
      return;
    }
    if (!form.instructions?.trim() || form.instructions.trim().length < 100) {
      setToast({ message: 'Preflight: Theory guide must be at least 100 characters.', type: 'error' });
      setPreflightPassed(false);
      return;
    }

    if (form.sandboxType === 'sql_worker') {
      if (!form.sqlSchema?.trim()) {
        setToast({ message: 'Preflight: Missing Table DDL/DML schema for SQL lab.', type: 'error' });
        setPreflightPassed(false);
        return;
      }
      if (!form.solution?.trim()) {
        setToast({ message: 'Preflight: Missing sample Reference Solution query for SQL lab.', type: 'error' });
        setPreflightPassed(false);
        return;
      }
    } else if (form.sandboxType === 'js_worker') {
      if (!form.initialSnippet?.trim()) {
        setToast({ message: 'Preflight: Missing Starter Code for Automation lab.', type: 'error' });
        setPreflightPassed(false);
        return;
      }
      if (!form.testScript?.trim()) {
        setToast({ message: 'Preflight: Missing Test Script for Automation lab.', type: 'error' });
        setPreflightPassed(false);
        return;
      }
    } else if (form.sandboxType === 'quizlet') {
      const questions = form.quizQuestions || [];
      if (questions.length === 0) {
        setToast({ message: 'Preflight: Missing questions in Quiz lab.', type: 'error' });
        setPreflightPassed(false);
        return;
      }
      const hasInvalid = questions.some(
        (q) => !q.question?.trim() || !q.options || q.options.length < 2 || q.correctIndex < 0
      );
      if (hasInvalid) {
        setToast({
          message: 'Preflight: Each question requires at least 2 options and a selected correct answer.',
          type: 'error',
        });
        setPreflightPassed(false);
        return;
      }
    }

    setPreflightPassed(true);
    setToast({
      message: 'Preflight passed! The lab is ready for submission and publishing.',
      type: 'success',
    });
  };

  // ── Pre-publish Validation Checklist ────────────────────────────────────
  const validationChecklist = useMemo(() => {
    const hasSeries = Boolean(form.seriesId);
    const hasTitle = form.title.trim().length >= 5;
    const hasTheory = (form.instructions || '').trim().length >= 100;

    let hasExerciseConfig = false;
    let exerciseReason = '';

    if (form.sandboxType === 'sql_worker') {
      const hasSchema = (form.sqlSchema || '').trim().length >= 20;
      const hasSolution = (form.solution || '').trim().length >= 10;
      hasExerciseConfig = hasSchema && hasSolution;
      if (!hasSchema) exerciseReason = 'Missing Table DDL/DML Schema';
      else if (!hasSolution) exerciseReason = 'Missing Reference Solution query';
    } else if (form.sandboxType === 'js_worker') {
      const hasStarter = (form.initialSnippet || '').trim().length >= 10;
      const hasSolution = (form.solution || '').trim().length >= 10;
      const hasTestScript = (form.testScript || '').trim().length >= 10;
      hasExerciseConfig = hasStarter && hasSolution && hasTestScript;
      if (!hasStarter) exerciseReason = 'Missing Starter Code for learners';
      else if (!hasSolution) exerciseReason = 'Missing Reference Solution';
      else if (!hasTestScript) exerciseReason = 'Missing Test cases';
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
      if (questions.length === 0) exerciseReason = 'No quiz questions configured';
      else if (!allValid) exerciseReason = 'Question has fewer than 2 options or no correct answer selected';
    } else {
      hasExerciseConfig = true; // markdown_only
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
        clearStudioDraft(draftKey);
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-series'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-labs'] });

      setToast({
        message: isEditing ? 'Lab updated successfully!' : 'Lab submitted/published successfully!',
        type: 'success',
      });
      setTimeout(() => {
        navigate(returnUrl);
      }, 1200);
    },
    onError: (err: any) => {
      setToast({
        message: err?.response?.data?.message || 'An error occurred while saving the lab.',
        type: 'error',
      });
    },
  });

  const handlePublish = () => {
    if (!validationChecklist.isAllValid) {
      if (!validationChecklist.hasSeries) {
        setToast({ message: 'Please select a parent Series.', type: 'error' });
        return;
      }
      if (!validationChecklist.hasTitle) {
        setToast({ message: 'Please enter a lab title (at least 5 characters).', type: 'error' });
        return;
      }
      if (!validationChecklist.hasTheory) {
        setToast({ message: 'Theory guide must be at least 100 characters.', type: 'error' });
        return;
      }
      if (!validationChecklist.hasExerciseConfig) {
        setToast({ message: `Exercise configuration incomplete: ${validationChecklist.exerciseReason}`, type: 'error' });
        return;
      }
    }
    if (!preflightPassed) {
      setToast({ message: 'Please run and pass Preflight check before publishing.', type: 'error' });
      return;
    }

    saveMutation.mutate();
  };

  const formatTypeName = {
    sql_worker: 'SQL Database',
    quizlet: 'Quizlet Assessment',
    js_worker: 'JavaScript Worker',
    markdown_only: 'Theory & Reading',
  }[form.sandboxType || 'sql_worker'];

  if (isEditing && isLoadingLab) {
    return (
      <div className="container mx-auto p-12 text-center text-sm text-muted-foreground">
        Loading lab details...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── UNIFIED FIXED TOP HEADER ───────────────────────────────── */}
      <header className="sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 border-b border-border bg-card/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 text-xs font-semibold px-2 text-muted-foreground hover:text-foreground"
          >
            <Link to={returnUrl}>Back to Content Hub</Link>
          </Button>

          <span className="text-muted-foreground/30 font-mono text-xs hidden sm:inline">|</span>

          {/* 2 Primary Mode Tabs: Editor vs Student Preview */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Editor
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Student Preview
            </button>
          </div>

          <Badge variant="outline" className="font-mono text-[11px] font-semibold text-primary border-primary/30 hidden md:inline-flex">
            {formatTypeName}
          </Badge>
        </div>

        {/* Right Actions: Auto-save status, Save Draft, Preflight, Publish */}
        <div className="flex items-center gap-2">
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
            className="h-8 text-xs font-medium px-3"
          >
            Save Draft
          </Button>

          {/* Preflight Test Button */}
          <Button
            type="button"
            variant={preflightPassed ? 'secondary' : 'default'}
            size="sm"
            onClick={handleRunPreflight}
            className={`h-8 text-xs font-medium px-3 transition-colors ${
              preflightPassed
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {preflightPassed && <CheckCircle2 className="size-3.5 mr-1" />}
            <span>{preflightPassed ? 'Preflight Passed' : 'Run Preflight'}</span>
          </Button>

          {/* Single Unified Publish / Submit Button with Pre-publish Checklist Gate */}
          <div className="relative group">
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saveMutation.isPending || !validationChecklist.isAllValid || !preflightPassed}
              className={`h-8 text-xs font-semibold px-4 shadow-xs transition-all ${
                validationChecklist.isAllValid && preflightPassed
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
            {(!validationChecklist.isAllValid || !preflightPassed) && (
              <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl text-xs z-50 hidden group-hover:block pointer-events-none animate-in fade-in-50">
                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                  <ShieldAlert className="size-3.5" />
                  <span>Publishing prerequisites not met</span>
                </div>
                <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                  {!preflightPassed && <li>Must pass Preflight check before publishing</li>}
                  {!validationChecklist.hasSeries && <li>Parent Series not selected</li>}
                  {!validationChecklist.hasTitle && <li>Title requires at least 5 characters</li>}
                  {!validationChecklist.hasTheory && <li>Theory guide requires at least 100 characters</li>}
                  {!validationChecklist.hasExerciseConfig && <li>{validationChecklist.exerciseReason}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-14 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-2">
          <Alert variant={toast.type === 'error' ? 'destructive' : 'default'} className="bg-card shadow-lg border">
            <AlertTitle className="text-xs font-bold">
              {toast.type === 'success' ? 'Success' : 'Validation Alert'}
            </AlertTitle>
            <AlertDescription className="text-xs mt-0.5">{toast.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── TAB 1: SOẠN THẢO (LÝ THUYẾT & BÀI TẬP RIÊNG BIỆT) ───────────────────────────── */}
      {activeTab === 'editor' && (
        <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full items-start">
          {/* CỘT TRÁI: Cấu hình chung & Checklist (~280px) */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-4">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block border-b border-border pb-2">
                Lab Configuration
              </span>

              {/* Series selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  Series *
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
                    const nextType = (nextFormat || form.sandboxType) as SandboxType;
                    setForm((prev) => ({
                      ...prev,
                      seriesId: e.target.value,
                      sandboxType: nextType,
                    }));
                    handleSandboxTypeChange(nextType);
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
              </div>

              {/* Sandbox format */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  Exercise Type *
                </label>
                <select
                  value={form.sandboxType}
                  onChange={(e) => handleSandboxTypeChange(e.target.value as SandboxType)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="sql_worker">SQL Database</option>
                  <option value="js_worker">JavaScript Worker</option>
                  <option value="quizlet">Quizlet Assessment</option>
                  <option value="markdown_only">Theory & Reading</option>
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
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    setPreflightPassed(false);
                  }}
                  placeholder="e.g., Filter VIP Customers with SQL WHERE"
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
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-muted-foreground">min</span>
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
                    <span>PRO Tier</span>
                  </label>
                </div>
              </div>

              {/* Pre-publish Readiness Checklist */}
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Publishing Checklist
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Parent Series:</span>
                    {validationChecklist.hasSeries ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">✓ Selected</span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">○ Not selected</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Title (≥ 5 chars):</span>
                    {validationChecklist.hasTitle ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">✓ Passed</span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">○ {form.title.trim().length}/5</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Theory (≥ 100 chars):</span>
                    {validationChecklist.hasTheory ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">✓ Passed</span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">
                        ○ {(form.instructions || '').trim().length}/100
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Exercise Config:</span>
                    {validationChecklist.hasExerciseConfig ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">✓ Passed</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 text-[11px]">⚠ Incomplete</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preflight:</span>
                    {preflightPassed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">✓ Passed</span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">○ Not run</span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Preview Button shortcut */}
              <div className="pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('preview')}
                  className="w-full text-xs font-semibold h-8"
                >
                  Open Student Preview →
                </Button>
              </div>
            </div>
          </div>

          {/* CỘT CHÍNH: Phân chia rõ ràng Lý thuyết riêng & Bài tập riêng */}
          <div className="flex-1 min-w-0 w-full flex flex-col space-y-6">
            {/* ── KHU VỰC 1: LÝ THUYẾT & HƯỚNG DẪN HỌC VIÊN ── */}
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    1. Theory & Learner Guide
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                      (form.instructions || '').trim().length >= 100
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {(form.instructions || '').trim().length} / 100 characters
                  </span>
                </div>
              </div>

              {/* Enhanced Fast Markdown Toolbar */}
              <SmartLabToolbar
                sandboxType={(form.sandboxType as SandboxType) || 'sql_worker'}
                onInsertSnippet={handleInsertTheorySnippet}
              />

              {/* Theory Markdown Editor */}
              <textarea
                ref={theoryTextareaRef}
                value={form.instructions}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, instructions: e.target.value }));
                  setPreflightPassed(false);
                }}
                placeholder="# 1. Core Theory...&#10;&#10;## 2. Syntax & Examples...&#10;&#10;## 3. Practice Requirements..."
                className="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-foreground resize-y focus:outline-none min-h-[260px]"
                spellCheck={false}
              />
            </div>

            {/* ── KHU VỰC 2: CẤU HÌNH BÀI TẬP THỰC HÀNH (RIÊNG BIỆT) ── */}
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    2. Exercise Configuration: <span className="text-primary">{formatTypeName}</span>
                  </h2>
                </div>
                <Badge variant="outline" className="font-mono text-xs uppercase text-primary border-primary/30">
                  {form.sandboxType}
                </Badge>
              </div>

              {/* FORMAT A: SQL DATABASE BUILDER */}
              {form.sandboxType === 'sql_worker' && (
                <SqlExerciseBuilder
                  sqlSchema={form.sqlSchema || ''}
                  onSqlSchemaChange={(val) => {
                    setForm((prev) => ({ ...prev, sqlSchema: val }));
                    setPreflightPassed(false);
                  }}
                  initialSnippet={form.initialSnippet || ''}
                  onInitialSnippetChange={(val) => {
                    setForm((prev) => ({ ...prev, initialSnippet: val }));
                    setPreflightPassed(false);
                  }}
                  solution={form.solution || ''}
                  onSolutionChange={(val) => {
                    setForm((prev) => ({ ...prev, solution: val }));
                    setPreflightPassed(false);
                  }}
                  sampleData={form.sampleData || []}
                  onSampleDataChange={(val) => {
                    setForm((prev) => ({ ...prev, sampleData: val }));
                    setPreflightPassed(false);
                  }}
                />
              )}

              {/* FORMAT B: JAVASCRIPT WORKER BUILDER */}
              {form.sandboxType === 'js_worker' && (
                <JsWorkerExerciseBuilder
                  initialSnippet={form.initialSnippet || ''}
                  onInitialSnippetChange={(val) => {
                    setForm((prev) => ({ ...prev, initialSnippet: val }));
                    setPreflightPassed(false);
                  }}
                  solution={form.solution || ''}
                  onSolutionChange={(val) => {
                    setForm((prev) => ({ ...prev, solution: val }));
                    setPreflightPassed(false);
                  }}
                  testScript={form.testScript || ''}
                  onTestScriptChange={(val) => {
                    setForm((prev) => ({ ...prev, testScript: val }));
                    setPreflightPassed(false);
                  }}
                />
              )}

              {/* FORMAT C: QUIZLET BUILDER */}
              {form.sandboxType === 'quizlet' && (
                <QuizletExerciseBuilder
                  questions={form.quizQuestions || []}
                  onChange={(nextQuestions) => {
                    setForm((prev) => ({ ...prev, quizQuestions: nextQuestions }));
                    setPreflightPassed(false);
                  }}
                />
              )}

              {/* FORMAT D: MARKDOWN ONLY */}
              {form.sandboxType === 'markdown_only' && (
                <div className="py-8 text-center space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Theory Reading Mode</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    This exercise format requires no executable code. Learners will read the theory in Section 1 and complete the lesson.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: XEM TRƯỚC HỌC VIÊN (TOÀN MÀN HÌNH KHÔNG BỊ CHÈN ÉP) ─────────────── */}
      {activeTab === 'preview' && (
        <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full h-[calc(100vh-80px)]">
          <StudioStudentPreview
            envelope={previewEnvelope}
            title={form.title || 'Lab Challenge Title'}
            sandboxType={(form.sandboxType as SandboxType) || 'sql_worker'}
          />
        </div>
      )}
    </div>
  );
}
