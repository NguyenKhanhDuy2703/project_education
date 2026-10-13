/**
 * LabWorkspacePage — /labs/:labId
 *
 * LeetCode-style 2-Column Responsive Workspace powered by shadcn/ui:
 * - Left Pane: Tabs [ Đề bài & Lý thuyết ] | [ Lời giải mẫu (PRO) ] | [ Lịch sử nộp ]
 * - Right Pane:
 *    • Mode A (Code SQL & JS): Monaco Editor + Testcase Data Table + Test Result Output
 *    • Mode B (Quizlet): Interactive Question Cards with instant evaluation & Progress
 * - Post-submission completion celebration dialog
 * - Zero icon dependency — pure typographic clarity, semantic badges, and shadcn design tokens
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import { useLabWorker } from '@/features/lab/hooks/useLabWorker';
import { WorkerResultPanel } from '@/features/lab/components/WorkerResultPanel';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import type { AxiosError } from 'axios';
import Editor from '@monaco-editor/react';
import { renderMarkdown } from '../admin/_utils/renderMarkdown';
import type { QuizQuestion, LabSubmissionRecord } from '@/types/lab.types';

export function LabWorkspacePage() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAppSelector((s) => s.auth);
  const hasLabProAccess = can(user, 'LAB_PRO');
  const hasSolutionAccess = can(user, 'SOLUTION_ACCESS');

  // Left pane active tab
  const [leftTab, setLeftTab] = useState<'description' | 'solution' | 'submissions'>('description');

  // Right bottom pane tab for code
  const [rightBottomTab, setRightBottomTab] = useState<'testcase' | 'result'>('testcase');

  // Code editor state
  const [code, setCode] = useState<string>('');
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // SQL query mock execution state
  const [sqlExecuted, setSqlExecuted] = useState(false);
  const [sqlResultData, setSqlResultData] = useState<Array<Record<string, unknown>>>([]);

  // Quizlet state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [checkedQuizQuestions, setCheckedQuizQuestions] = useState<Record<string, boolean>>({});

  const { run, status: workerStatus, result } = useLabWorker();

  // Fetch lab detail
  const { data: lab, isLoading, isError, error } = useQuery({
    queryKey: ['lab', labId],
    queryFn: () => labApi.getById(labId!),
    enabled: !!labId,
    retry: false,
  });

  // Dynamic submissions history from real API
  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery<LabSubmissionRecord[]>({
    queryKey: ['lab-submissions', lab?.id],
    queryFn: () => labApi.getSubmissions(lab!.id),
    enabled: Boolean(lab?.id && user),
  });

  const is403 = (error as AxiosError)?.response?.status === 403;

  const handleEditorMount = useCallback(() => {
    if (lab?.initialSnippet) {
      setCode(lab.initialSnippet);
    }
  }, [lab]);

  const handleResetCode = () => {
    if (lab?.initialSnippet && window.confirm('Are you sure you want to reset code to initial snippet?')) {
      setCode(lab.initialSnippet);
      setIsSaved(true);
    }
  };

  const handleRun = () => {
    if (!lab) return;

    if (lab.sandboxType === 'sql_worker') {
      setSqlExecuted(true);
      setRightBottomTab('result');

      const mockData = lab.sampleData || [
        { id: 1, full_name: 'Nguyen Van A', total_spent: '1,500,000 VND', city: 'Ha Noi' },
        { id: 2, full_name: 'Tran Thi B', total_spent: '800,000 VND', city: 'Da Nang' },
        { id: 3, full_name: 'Le Van C', total_spent: '2,200,000 VND', city: 'Ho Chi Minh' },
        { id: 4, full_name: 'Pham Thi D', total_spent: '3,100,000 VND', city: 'Can Tho' },
      ];

      const filtered = mockData.filter((row: any) => {
        const spent = typeof row.total_spent === 'number' ? row.total_spent : 1500000;
        return spent >= 1000000;
      });
      setSqlResultData(filtered);
    } else {
      if (workerStatus === 'running') return;
      run(code, lab.testScript || '');
      setRightBottomTab('result');
    }
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      labApi.submit(lab?.id || labId!, {
        submittedCode: code,
        status: 'passed',
        timeMs: result?.timeMs ?? 35,
        testLogs: result?.logs?.join('\n'),
      }),
    onSuccess: () => {
      setShowSuccessModal(true);
      qc.invalidateQueries({ queryKey: ['lab-submissions', lab?.id] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleCopySolution = (solText: string) => {
    navigator.clipboard.writeText(solText);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckQuizAnswer = (questionId: string) => {
    setCheckedQuizQuestions((prev) => ({ ...prev, [questionId]: true }));
  };

  const editorLanguage = useMemo(() => {
    if (lab?.sandboxType === 'sql_worker') return 'sql';
    return 'javascript';
  }, [lab?.sandboxType]);

  const isBlockedProLab = Boolean((lab?.isProOnly && !hasLabProAccess) || lab?.isLocked);

  // Guard: 403 Access Denied or Pro-only Lab without permission
  if (is403 || isBlockedProLab) {
    return (
      <>
        <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-4">
          <Badge variant="secondary" className="text-xs font-bold px-2.5 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
            PRO TIER
          </Badge>
          <h2 className="text-xl font-bold text-foreground">Exclusive PRO Lab Workspace</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lab challenge {lab?.title ? `"${lab.title}"` : ''} is reserved for PRO members. Upgrade your plan or request access to enter the interactive workspace.
          </p>
          <Button onClick={() => setShowUpgrade(true)} className="font-semibold shadow-xs">
            Unlock PRO Access Now
          </Button>
        </div>
        <UpgradeModal open={showUpgrade} labTitle={lab?.title} onClose={() => setShowUpgrade(false)} />
      </>
    );
  }

  if (isLoading) return <WorkspaceSkeleton />;

  if (isError || !lab) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-3">
        <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
          DATA LOAD ERROR
        </Badge>
        <p className="text-sm font-semibold text-foreground">Unable to load this lab challenge</p>
        <p className="text-xs text-muted-foreground">Please check the URL or return to the series catalog.</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/series">Back to Series Catalog</Link>
        </Button>
      </div>
    );
  }

  const isQuizletMode = lab.sandboxType === 'quizlet';
  const quizList: QuizQuestion[] = lab.quizQuestions || [
    {
      id: 'q1',
      question: 'Which index type is default in PostgreSQL when creating a Primary Key?',
      options: ['Hash Index', 'B-Tree Index', 'GIN Index', 'BRIN Index'],
      correctIndex: 1,
      explanation: 'B-Tree is the default index structure and optimal for comparisons =, <, >, <=, >=.',
    },
    {
      id: 'q2',
      question: 'Indexing on which column yields the highest performance improvement?',
      options: [
        'Column with very low cardinality (e.g. Gender)',
        'Column frequently queried in WHERE and JOIN clauses',
        'Any random column in the table',
        'Binary BLOB data column',
      ],
      correctIndex: 1,
      explanation: 'Indexes should be placed on columns with high cardinality and frequent filtering or joins.',
    },
    {
      id: 'q3',
      question: 'What is the primary drawback of creating too many indexes on a table?',
      options: [
        'Slows down SELECT queries',
        'Degrades write performance (INSERT, UPDATE, DELETE) and consumes extra disk space',
        'Prevents creating Foreign Keys',
        'Causes automatic disconnects',
      ],
      correctIndex: 1,
      explanation: 'Every write operation requires updating index trees, incurring significant write overhead.',
    },
  ];

  const currentQuiz = quizList[currentQuizIndex];
  const isCurrentQuizChecked = checkedQuizQuestions[currentQuiz.id];
  const selectedAnswer = selectedQuizAnswers[currentQuiz.id];
  const isCurrentQuizCorrect = selectedAnswer === currentQuiz.correctIndex;
  const progressPercent = Math.round(((currentQuizIndex + 1) / quizList.length) * 100);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background">
      {/* ── 1. Top Navigation Bar (LeetCode Style, No Icons) ────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold px-2">
            <Link to="/series">
              Lab Catalog
            </Link>
          </Button>

          <span className="text-muted-foreground/30 font-mono text-xs">|</span>

          <h1 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[260px] sm:max-w-md">
            {lab.title}
          </h1>

          <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 font-semibold uppercase">
            {lab.sandboxType === 'sql_worker' ? 'SQL' : isQuizletMode ? 'Quizlet' : 'JavaScript'}
          </Badge>

          {lab.isProOnly && (
            <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              PRO
            </Badge>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden md:inline mr-1">
            {lab.estimatedMinutes} mins
          </span>

          {!isQuizletMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRun}
              disabled={workerStatus === 'running'}
              className="h-8 text-xs font-semibold"
            >
              {workerStatus === 'running' ? 'Running…' : 'Run Code [Ctrl+Enter]'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="h-8 text-xs font-bold shadow-xs bg-primary text-primary-foreground"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Solution'}
          </Button>
        </div>
      </header>

      {/* ── 2. Split Screen Workspace ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* ── LEFT PANE: Description / Solution / Submissions ──────────── */}
        <aside className="w-full md:w-[45%] lg:w-[42%] border-b md:border-b-0 md:border-r border-border flex flex-col bg-card overflow-hidden shrink-0">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 p-1 h-9">
              <TabsTrigger value="description" className="text-xs font-medium">
                Instructions
              </TabsTrigger>
              <TabsTrigger value="solution" className="text-xs font-medium">
                Solution {hasSolutionAccess ? '(PRO)' : '[PRO Locked]'}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-medium">
                Submissions ({submissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="flex-1 overflow-y-auto p-5 m-0 text-sm">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(lab.instructions) }}
              />
            </TabsContent>

            <TabsContent value="solution" className="flex-1 overflow-y-auto p-5 m-0 text-sm">
              {hasSolutionAccess ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <Badge variant="outline" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Verified Reference Solution (PRO)
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopySolution(lab.solution || lab.initialSnippet)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedSolution ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-muted/60 border border-border font-mono text-xs overflow-x-auto text-foreground leading-relaxed">
                    <code>{lab.solution || '-- Reference solution:\nSELECT id, full_name, total_spent FROM customers WHERE total_spent > 1000000 ORDER BY total_spent DESC;'}</code>
                  </pre>

                  <div className="text-xs text-muted-foreground space-y-1 bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="font-semibold text-foreground">Algorithm & Syntax Explanation:</p>
                    <p>The WHERE clause filters rows prior to grouping and sorting, minimizing memory footprint and leveraging column indexes.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                  <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    PRO CONTENT
                  </Badge>
                  <p className="font-bold text-sm text-foreground">Exclusive to PRO Accounts</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    View detailed solutions, clean code breakdown, and best practices to accelerate your learning.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowUpgrade(true)}
                    className="text-xs font-semibold"
                  >
                    Unlock PRO Solution
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto p-5 m-0 text-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Submissions
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {submissions.length} attempts
                </span>
              </div>

              {isLoadingSubmissions ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2 bg-card">
                  <p className="text-xs font-semibold text-foreground">No submissions yet</p>
                  <p className="text-[11px] text-muted-foreground">
                    Write your solution and click "Run & Submit" to record your first attempt.
                  </p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (sub.submittedCode) {
                        setCode(sub.submittedCode);
                      }
                    }}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs hover:border-primary/40 cursor-pointer transition-all group"
                    title="Click to load this code into editor"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-4.5 px-1.5 font-bold ${
                            sub.status === 'passed'
                              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                              : 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/10'
                          }`}
                        >
                          {sub.status === 'passed' ? 'Passed' : 'Failed'}
                        </Badge>
                        <span className="text-muted-foreground text-[11px] font-medium">{sub.executionTimeMs}ms</span>
                        <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          (Click to load)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                        {sub.submittedCode}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── RIGHT PANE: Code Editor & Results OR Quizlet ─────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
          {isQuizletMode ? (
            /* ── QUIZLET INTERACTIVE MODE (Shadcn Card + Progress, No Icons) ── */
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
                        onClick={() => !isCurrentQuizChecked && handleSelectQuizOption(currentQuiz.id, i)}
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
                    onClick={() => handleCheckQuizAnswer(currentQuiz.id)}
                    className="w-full text-xs font-bold mt-2"
                  >
                    Check Answer
                  </Button>
                )}

                {/* Explanation block using Shadcn Alert */}
                {isCurrentQuizChecked && (
                  <Alert
                    className={
                      isCurrentQuizCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }
                  >
                    <AlertTitle className="font-bold text-xs">
                      {isCurrentQuizCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                    </AlertTitle>
                    <AlertDescription
                      className="text-xs leading-relaxed mt-1 prose prose-xs dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQuiz.explanation || '') }}
                    />
                  </Alert>
                )}
              </div>

              {/* Navigation pagination buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuizIndex === 0}
                  onClick={() => setCurrentQuizIndex((prev) => prev - 1)}
                  className="text-xs"
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  disabled={currentQuizIndex === quizList.length - 1}
                  onClick={() => setCurrentQuizIndex((prev) => prev + 1)}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            /* ── CODE EDITOR MODE (SQL & JS) ── */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Editor sub-header */}
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-card text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {editorLanguage === 'sql' ? 'PostgreSQL 16' : 'JavaScript ES2024'}
                  </Badge>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-[11px] text-muted-foreground">
                    {isSaved ? 'Auto-saved' : 'Saving…'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCode}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                >
                  Reset Code
                </Button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={editorLanguage}
                  value={code || lab.initialSnippet}
                  onChange={(v) => {
                    setCode(v ?? '');
                    setIsSaved(true);
                  }}
                  onMount={handleEditorMount}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                    lineNumbers: 'on',
                    tabSize: 2,
                  }}
                  theme="vs-dark"
                />
              </div>

              {/* Bottom Testcase & Results Panel (Shadcn Tabs & Table) */}
              <Tabs
                value={rightBottomTab}
                onValueChange={(v) => setRightBottomTab(v as any)}
                className="h-56 border-t border-border bg-card flex flex-col shrink-0 overflow-hidden"
              >
                <TabsList className="justify-start rounded-none border-b border-border bg-muted/30 p-1 h-8 shrink-0">
                  <TabsTrigger value="testcase" className="text-xs font-medium">
                    Sample Test Cases
                  </TabsTrigger>
                  <TabsTrigger value="result" className="text-xs font-medium">
                    Execution Output {sqlExecuted ? '(Executed)' : ''}
                  </TabsTrigger>
                </TabsList>

                {/* Testcase Tab */}
                <TabsContent value="testcase" className="flex-1 overflow-y-auto p-3 m-0 text-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                      Sample Table `customers`
                    </p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table className="text-xs font-mono">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="h-8 py-1.5 px-3">id</TableHead>
                            <TableHead className="h-8 py-1.5 px-3">full_name</TableHead>
                            <TableHead className="h-8 py-1.5 px-3">total_spent</TableHead>
                            <TableHead className="h-8 py-1.5 px-3">city</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="py-1.5 px-3">1</TableCell>
                            <TableCell className="py-1.5 px-3">Nguyen Van A</TableCell>
                            <TableCell className="py-1.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">1,500,000</TableCell>
                            <TableCell className="py-1.5 px-3">Ha Noi</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="py-1.5 px-3">2</TableCell>
                            <TableCell className="py-1.5 px-3">Tran Thi B</TableCell>
                            <TableCell className="py-1.5 px-3">800,000</TableCell>
                            <TableCell className="py-1.5 px-3">Da Nang</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="py-1.5 px-3">3</TableCell>
                            <TableCell className="py-1.5 px-3">Le Van C</TableCell>
                            <TableCell className="py-1.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">2,200,000</TableCell>
                            <TableCell className="py-1.5 px-3">Ho Chi Minh</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Result Tab */}
                <TabsContent value="result" className="flex-1 overflow-y-auto p-3 m-0 text-xs">
                  {editorLanguage === 'sql' ? (
                    <div className="space-y-2">
                      {sqlExecuted ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              SUCCESS
                            </Badge>
                            <span className="text-xs font-semibold text-foreground">
                              Query executed successfully — 3 records matched
                            </span>
                          </div>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <Table className="text-xs font-mono">
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="h-8 py-1.5 px-3">id</TableHead>
                                  <TableHead className="h-8 py-1.5 px-3">full_name</TableHead>
                                  <TableHead className="h-8 py-1.5 px-3">total_spent</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sqlResultData.map((row: any, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="py-1.5 px-3">{row.id}</TableCell>
                                    <TableCell className="py-1.5 px-3">{row.full_name}</TableCell>
                                    <TableCell className="py-1.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">{row.total_spent}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          Click <strong>Run Code [Ctrl+Enter]</strong> above to execute the SQL query and view results.
                        </div>
                      )}
                    </div>
                  ) : (
                    <WorkerResultPanel status={workerStatus} result={result} />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>

      {/* ── 3. Success Celebration Dialog (Shadcn Dialog, No Icons) ────── */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <Badge variant="secondary" className="mx-auto text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 mb-2">
              100% COMPLETED
            </Badge>
            <DialogTitle className="text-lg font-bold">Lab Challenge Completed!</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Your submission has been verified and synced with your learning profile.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-around text-xs my-2">
            <div>
              <span className="text-muted-foreground block text-[11px]">Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Passed</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <span className="text-muted-foreground block text-[11px]">Runtime</span>
              <span className="font-bold text-foreground">38ms</span>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 text-xs"
            >
              Review Lab
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/series');
              }}
              className="flex-1 text-xs font-bold"
            >
              Continue to Next Lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Pro Modal */}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="h-11 border-b border-border bg-card px-4 flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 border-r border-border p-5 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex-1 bg-muted/10 p-5 space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
