/**
 * AdminLabStudioPage — /admin/labs/new hoặc /admin/labs/:labId/edit
 *
 * Trình thuật sĩ 2 Bước tuần tự (2-Step Stepper Wizard):
 * - BƯỚC 1: Tạo Kiến thức & Nội dung Lý thuyết (Content First bằng Markdown phong phú)
 * - BƯỚC 2: Thiết lập Bài tập theo Thể loại (Format SQL hoặc Format Quizlet hỗ trợ tối đa 30 câu, định dạng Markdown)
 * - Zero icons, powered by shadcn/ui.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { CreateLabInput, QuizQuestion } from '@/types/lab.types';
import { renderMarkdown } from './_utils/renderMarkdown';

export function AdminLabStudioPage() {
  const { labId } = useParams<{ labId?: string }>();
  const [searchParams] = useSearchParams();
  const seriesIdFromQuery = searchParams.get('seriesId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditing = !!labId && labId !== 'new';

  // ── Stepper: Step 1 (Content First) vs Step 2 (Exercises) ────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Markdown Preview tabs
  const [theoryPreviewTab, setTheoryPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizPreviewMode, setQuizPreviewMode] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [form, setForm] = useState<CreateLabInput>({
    seriesId: seriesIdFromQuery,
    title: '',
    sandboxType: 'sql_worker',
    objective: '',
    instructions: '# 1. Core Theory\n\nSummarize essential concepts and background knowledge.\n\n## 2. Lab Requirements\n\nWrite queries or answer verification questions below...',
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
        question: 'Question 1: Enter question text (supports `Markdown` and code blocks)...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: 'Explain why this option is correct based on the theory in Step 1.',
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
        quizQuestions: existingLab.quizQuestions && existingLab.quizQuestions.length > 0
          ? existingLab.quizQuestions
          : [
              {
                id: 'q1',
                question: 'Question 1: Enter question text...',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctIndex: 0,
                explanation: 'Explain correct answer...',
              },
            ],
      });
    } else if (seriesIdFromQuery && !form.seriesId) {
      setForm((prev) => ({ ...prev, seriesId: seriesIdFromQuery }));
    }
  }, [existingLab, seriesIdFromQuery]);

  // Nhận diện Topic cha và đồng nhất thể loại bài tập
  const selectedSeriesId = form.seriesId || seriesIdFromQuery;
  const parentTopic = seriesList.find((s) => s.id === selectedSeriesId);

  useEffect(() => {
    if (parentTopic && !isEditing) {
      const topicFormat = parentTopic.formatType || (parentTopic.slug.includes('sql') ? 'sql_worker' : parentTopic.slug.includes('quiz') ? 'quizlet' : 'js_worker');
      setForm((prev) => ({
        ...prev,
        seriesId: parentTopic.id,
        sandboxType: topicFormat,
      }));
    }
  }, [parentTopic?.id, parentTopic?.formatType, isEditing]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: () => {
      if (isEditing) {
        return labApi.update(labId!, form);
      }
      return labApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setToast({
        message: isEditing ? 'Practice lab updated successfully!' : 'Practice lab created and published successfully!',
        type: 'success',
      });
      setTimeout(() => {
        navigate('/admin/content');
      }, 1200);
    },
    onError: (err: any) => {
      setToast({
        message: err?.response?.data?.message || 'An error occurred while saving the practice lab.',
        type: 'error',
      });
    },
  });

  // Presets Handlers
  const handleApplyPreset = (type: 'sql' | 'quizlet' | 'js' | 'blog') => {
    if (type === 'sql') {
      setForm((prev) => ({
        ...prev,
        sandboxType: 'sql_worker',
        title: prev.title || 'Filter VIP Customers with SQL WHERE Clause',
        sqlSchema: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  full_name VARCHAR(100),
  total_spent DECIMAL(12, 2),
  city VARCHAR(50)
);

INSERT INTO customers VALUES 
(1, 'Alice Johnson', 1500.00, 'New York'),
(2, 'Bob Smith', 800.00, 'Chicago'),
(3, 'Charlie Brown', 2200.00, 'San Francisco'),
(4, 'Diana Prince', 3100.00, 'Seattle');`,
        initialSnippet: '-- Write a SELECT query to get customers with total_spent > $1,000:\nSELECT id, full_name, total_spent \nFROM customers \nWHERE ...;',
        solution: 'SELECT id, full_name, total_spent \nFROM customers \nWHERE total_spent > 1000 \nORDER BY total_spent DESC;',
      }));
    } else if (type === 'quizlet') {
      setForm((prev) => ({
        ...prev,
        sandboxType: 'quizlet',
        title: prev.title || 'Database Indexing & Performance Quiz',
        quizQuestions: [
          {
            id: 'q1',
            question: 'Which index type is default in **PostgreSQL** when creating a primary key (`PRIMARY KEY`)?',
            options: ['Hash Index', 'B-Tree Index', 'GIN Index', 'BRIN Index'],
            correctIndex: 1,
            explanation: '`B-Tree` is the default and optimal index structure for equality and range comparisons (`=`, `<`, `>`, `<=`, `>=`).',
          },
          {
            id: 'q2',
            question: 'When is it **MOST BENEFICIAL** to create an Index on a relational database column?',
            options: [
              'Columns with very low cardinality (e.g. boolean flags)',
              'Columns frequently evaluated in `WHERE` filters and `JOIN` conditions',
              'Any random column in large tables',
              'Never create indexes because they consume disk space',
            ],
            correctIndex: 1,
            explanation: 'Indexes should prioritize selective columns (**High Cardinality**) frequently queried in filters and joins.',
          },
        ],
      }));
    } else if (type === 'js') {
      setForm((prev) => ({
        ...prev,
        sandboxType: 'js_worker',
        title: prev.title || 'Normalize US Phone Numbers with Regex',
        initialSnippet: 'function normalizePhone(phone) {\n  // Your code here\n  return "";\n}',
        testScript: `assert("Area code format", normalizePhone("1234567890") === "+11234567890");`,
        solution: 'function normalizePhone(phone) {\n  if (phone.length === 10) return "+1" + phone;\n  return phone;\n}',
      }));
    } else if (type === 'blog') {
      setForm((prev) => ({
        ...prev,
        sandboxType: 'markdown_only',
        title: prev.title || 'Microservices Architecture & Event-Driven Patterns Overview',
      }));
    }
  };

  // ── Quizlet Multi-Question Builder (Max 30 Questions) ──────────────────────
  const quizQuestions: QuizQuestion[] = form.quizQuestions || [];

  const handleAddQuizQuestion = () => {
    if (quizQuestions.length >= 30) {
      alert('A lab can contain a maximum of 30 multiple-choice questions.');
      return;
    }
    const newIndex = quizQuestions.length + 1;
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: `Question ${newIndex}: Enter question prompt (supports **Markdown**)...`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: '',
    };
    const nextList = [...quizQuestions, newQ];
    setForm({ ...form, quizQuestions: nextList });
    setActiveQuizIndex(nextList.length - 1);
  };

  const handleUpdateCurrentQuiz = (updated: Partial<QuizQuestion>) => {
    const nextList = [...quizQuestions];
    nextList[activeQuizIndex] = { ...nextList[activeQuizIndex], ...updated };
    setForm({ ...form, quizQuestions: nextList });
  };

  const handleUpdateCurrentQuizOption = (optIndex: number, val: string) => {
    const nextList = [...quizQuestions];
    const opts = [...nextList[activeQuizIndex].options];
    opts[optIndex] = val;
    nextList[activeQuizIndex].options = opts;
    setForm({ ...form, quizQuestions: nextList });
  };

  const handleRemoveCurrentQuiz = () => {
    if (quizQuestions.length <= 1) {
      alert('A quiz must have at least 1 question.');
      return;
    }
    const nextList = quizQuestions.filter((_, i) => i !== activeQuizIndex);
    setForm({ ...form, quizQuestions: nextList });
    setActiveQuizIndex(Math.max(0, activeQuizIndex - 1));
  };

  // Step 1 Validation before moving to Step 2
  const handleProceedToStep2 = () => {
    if (!form.title.trim()) {
      setToast({ message: 'Please enter a Lab Title before proceeding.', type: 'error' });
      return;
    }
    if (!form.seriesId) {
      setToast({ message: 'Please select a parent Topic / Series.', type: 'error' });
      return;
    }
    if (!form.instructions.trim()) {
      setToast({ message: 'Please write the Theory & Instructions in Step 1.', type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  const currentQuiz = quizQuestions[activeQuizIndex] || quizQuestions[0];

  const formatTypeName = {
    sql_worker: 'SQL Format',
    quizlet: 'Quizlet Format',
    js_worker: 'JavaScript Format',
    markdown_only: 'Article Format',
  }[form.sandboxType || 'sql_worker'];

  if (isEditing && isLoadingLab) {
    return (
      <div className="container mx-auto p-12 text-center text-sm text-muted-foreground">
        Loading practice lab...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top Header & Stepper Navigator Bar ──────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold px-2">
            <Link to="/admin/content">
              Back to Content Studio
            </Link>
          </Button>

          <span className="text-muted-foreground/30 font-mono text-xs">|</span>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentStep === 1
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Step 1: Theory &amp; Guidelines
            </button>

            <span className="text-muted-foreground/40 font-mono text-xs">→</span>

            <button
              type="button"
              onClick={handleProceedToStep2}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentStep === 2
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Step 2: Configure Exercise ({formatTypeName})
            </button>
          </div>
        </div>

        {/* Quick Presets & Final Actions */}
        <div className="flex items-center gap-2">
          {currentStep === 1 ? (
            <>
              <span className="text-[11px] text-muted-foreground mr-1 hidden lg:inline">Quick Templates:</span>
              <Button type="button" variant="outline" size="sm" onClick={() => handleApplyPreset('sql')} className="h-7 text-xs px-2 font-mono">
                SQL
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleApplyPreset('quizlet')} className="h-7 text-xs px-2 font-mono">
                Quizlet
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleApplyPreset('js')} className="h-7 text-xs px-2 font-mono">
                JS
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleApplyPreset('blog')} className="h-7 text-xs px-2 font-mono">
                Blog
              </Button>

              <div className="h-4 w-px bg-border mx-1" />

              <Button
                size="sm"
                onClick={handleProceedToStep2}
                className="h-8 text-xs font-bold px-4 bg-primary text-primary-foreground shadow-xs"
              >
                Proceed: Step 2 (Exercise) →
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="h-8 text-xs font-semibold px-3"
              >
                ← Back to Step 1
              </Button>

              {isEditing && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold">
                  <Link to={`/labs/${labId}`} target="_blank">
                    Preview in Workspace
                  </Link>
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="h-8 text-xs font-bold px-4 bg-primary text-primary-foreground shadow-xs"
              >
                {saveMutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Practice Lab'}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert variant={toast.type === 'error' ? 'destructive' : 'default'} className="bg-card shadow-lg">
            <AlertTitle className="text-xs font-bold">
              {toast.type === 'success' ? 'Success' : 'Error'}
            </AlertTitle>
            <AlertDescription className="text-xs mt-0.5">
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── STEP 1: THEORY & INSTRUCTIONS (CONTENT FIRST) ───── */}
      {currentStep === 1 && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Metadata Block */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  1. General Information &amp; Lab Domain
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define the lab title, parent topic, and exercise execution type configured in Step 2.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                STEP 1 / 2
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-foreground">Parent Topic *</label>
                <select
                  required
                  value={form.seriesId}
                  onChange={(e) => {
                    const nextTopic = seriesList.find((s) => s.id === e.target.value);
                    const nextFormat = nextTopic?.formatType || (nextTopic?.slug.includes('sql') ? 'sql_worker' : nextTopic?.slug.includes('quiz') ? 'quizlet' : 'js_worker');
                    setForm({
                      ...form,
                      seriesId: e.target.value,
                      sandboxType: nextFormat || form.sandboxType,
                    });
                  }}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="">-- Select Parent Topic --</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.formatType === 'sql_worker' ? 'SQL' : s.formatType === 'quizlet' ? 'Quizlet' : 'JS'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Exercise Sandbox Type *</label>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    INHERITED FROM PARENT
                  </Badge>
                </div>
                <div className="w-full mt-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground flex items-center justify-between font-medium">
                  <span>
                    {form.sandboxType === 'sql_worker'
                      ? 'SQL Queries (Database Sandbox)'
                      : form.sandboxType === 'quizlet'
                      ? 'Quizlet Assessment (Multiple Choice)'
                      : form.sandboxType === 'js_worker'
                      ? 'JavaScript Code (Web Worker)'
                      : 'Theory Article (Markdown Only)'}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {form.sandboxType}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
              <div className="sm:col-span-8">
                <label className="text-xs font-semibold text-foreground">Lab Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Filter VIP Customers with SQL WHERE"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Duration (Minutes)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 20 })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={form.isProOnly}
                    onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
                    className="rounded text-primary focus:ring-primary size-4"
                  />
                  Require PRO
                </label>
              </div>
            </div>
          </div>

          {/* Theory Markdown Editor Block */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  2. Lesson Instructions &amp; Conceptual Guidelines (Markdown Content) *
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Learners review this theoretical material before attempting the practical exercise in Step 2.
                </p>
              </div>

              <Tabs value={theoryPreviewTab} onValueChange={(v) => setTheoryPreviewTab(v as any)}>
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="edit" className="text-xs px-3">
                    Write Markdown
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs px-3">
                    Live Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {theoryPreviewTab === 'edit' ? (
              <textarea
                required
                rows={14}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="# 1. Core Concepts...&#10;&#10;## Problem Statement & Guidelines..."
                className="w-full font-mono text-xs sm:text-sm bg-background border border-border rounded-xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed shadow-xs"
              />
            ) : (
              <div
                className="w-full min-h-[300px] bg-background border border-border rounded-xl p-6 prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.instructions) }}
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                After drafting theory guidelines, click proceed to configure the practical exercise.
              </span>
              <Button
                type="button"
                onClick={handleProceedToStep2}
                className="text-xs font-bold px-4"
              >
                Proceed: Step 2 (Exercise Configuration) →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONFIGURE EXERCISES (EXERCISES) ────── */}
      {currentStep === 2 && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Header of Step 2 */}
          <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  STEP 2 / 2
                </Badge>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Configure Practice Exercise: {formatTypeName}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configuring for: <strong>"{form.title}"</strong>
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold"
            >
              ← Back to Step 1 (Theory)
            </Button>
          </div>

          {/* ── FORMAT A: SQL PRACTICE BUILDER ──────────────────────────── */}
          {form.sandboxType === 'sql_worker' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  SQL Database Challenge
                </h3>
                <p className="text-xs text-muted-foreground">
                  Provide table creation schema, seed data, and model solution for automated query validation.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Initial Database Schema (CREATE TABLE &amp; INSERT INTO) *</span>
                  <span className="font-mono text-[11px] text-muted-foreground">PostgreSQL DDL</span>
                </label>
                <textarea
                  rows={6}
                  value={form.sqlSchema || ''}
                  onChange={(e) => setForm({ ...form, sqlSchema: e.target.value })}
                  placeholder="CREATE TABLE customers (id INT, full_name VARCHAR, total_spent DECIMAL);&#10;INSERT INTO customers VALUES (1, 'Alice Smith', 1500000);"
                  className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Starter Code (Initial Snippet)
                  </label>
                  <textarea
                    rows={4}
                    value={form.initialSnippet || ''}
                    onChange={(e) => setForm({ ...form, initialSnippet: e.target.value })}
                    placeholder="-- Write a query to select customers...&#10;SELECT id, full_name, total_spent FROM customers WHERE ...;"
                    className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Model Solution *
                  </label>
                  <textarea
                    rows={4}
                    value={form.solution || ''}
                    onChange={(e) => setForm({ ...form, solution: e.target.value })}
                    placeholder="SELECT id, full_name, total_spent FROM customers WHERE total_spent > 1000000 ORDER BY total_spent DESC;"
                    className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── FORMAT B: QUIZLET MULTI-QUESTION BUILDER (MAX 30 QUESTIONS) ─ */}
          {form.sandboxType === 'quizlet' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
              {/* Question list counter & Add action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Quizlet Assessment Questions (Markdown supported, up to 30 questions)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current: <strong>{quizQuestions.length} / 30</strong> questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={quizQuestions.length >= 30}
                    onClick={handleAddQuizQuestion}
                    className="h-8 text-xs font-bold"
                  >
                    + Add Question ({quizQuestions.length}/30)
                  </Button>
                </div>
              </div>

              {/* Question Stepper Pills (1, 2, 3... 30) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quizQuestions.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setActiveQuizIndex(idx)}
                    className={`size-8 rounded-lg text-xs font-bold transition-all ${
                      activeQuizIndex === idx
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Question Editor Card */}
              {currentQuiz && (
                <div className="p-5 rounded-2xl border border-border bg-background space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">
                      Editing: Question {activeQuizIndex + 1} of {quizQuestions.length}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuizPreviewMode(!quizPreviewMode)}
                        className="h-7 text-xs px-2"
                      >
                        {quizPreviewMode ? 'Switch to Edit' : 'Preview Question Markdown'}
                      </Button>
                      {quizQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCurrentQuiz}
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                        >
                          Delete This Question
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt (Markdown supported) */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Question Prompt (Supports Markdown: bold, code blocks, tables) *
                    </label>
                    {quizPreviewMode ? (
                      <div
                        className="w-full mt-1.5 p-3.5 bg-card border border-border rounded-xl text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none min-h-[70px]"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQuiz.question) }}
                      />
                    ) : (
                      <textarea
                        rows={3}
                        required
                        value={currentQuiz.question}
                        onChange={(e) => handleUpdateCurrentQuiz({ question: e.target.value })}
                        placeholder="e.g. Which index structure is default in PostgreSQL when creating a `PRIMARY KEY`?"
                        className="w-full mt-1.5 font-mono text-xs sm:text-sm bg-card border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                      />
                    )}
                  </div>

                  {/* 4 Choices */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-foreground">
                      4 Answer Choices (Select radio button for correct option) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQuiz.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                            currentQuiz.correctIndex === optIdx
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-border bg-card'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-correct-${activeQuizIndex}`}
                            checked={currentQuiz.correctIndex === optIdx}
                            onChange={() => handleUpdateCurrentQuiz({ correctIndex: optIdx })}
                            className="size-4 text-primary"
                            title="Mark as correct answer"
                          />
                          <span className="font-mono text-xs font-bold text-muted-foreground w-4">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateCurrentQuizOption(optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-foreground focus:outline-none font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Explanation */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Detailed Explanation (Markdown supported — displayed upon submission)
                    </label>
                    <textarea
                      rows={2}
                      value={currentQuiz.explanation || ''}
                      onChange={(e) => handleUpdateCurrentQuiz({ explanation: e.target.value })}
                      placeholder="Explain why this option is correct based on the theory in Step 1..."
                      className="w-full mt-1.5 font-mono text-xs bg-card border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FORMAT C: JAVASCRIPT WORKER BUILDER ─────────────────────── */}
          {form.sandboxType === 'js_worker' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">JavaScript Worker Challenge</h3>
              <div>
                <label className="text-xs font-semibold text-foreground">Starter Code (Initial Snippet)</label>
                <textarea
                  rows={3}
                  value={form.initialSnippet || ''}
                  onChange={(e) => setForm({ ...form, initialSnippet: e.target.value })}
                  placeholder="function solve() { ... }"
                  className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Automated Test Script (assert)</label>
                <textarea
                  rows={3}
                  value={form.testScript || ''}
                  onChange={(e) => setForm({ ...form, testScript: e.target.value })}
                  placeholder="assert('Test 1', solve() === true);"
                  className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Reference Solution</label>
                <textarea
                  rows={3}
                  value={form.solution || ''}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="function solve() { return true; }"
                  className="w-full mt-1.5 font-mono text-xs bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* ── FORMAT D: BLOG ONLY ─────────────────────────────────────── */}
          {form.sandboxType === 'markdown_only' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs text-xs text-muted-foreground">
              Article-only mode: Students read the theory material in Step 1 and mark as complete without writing code.
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold"
            >
              ← Back to Step 1 (Theory)
            </Button>

            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="text-xs font-bold px-5 bg-primary text-primary-foreground shadow-xs"
            >
              {saveMutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Practice Lab'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
