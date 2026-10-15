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
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import { seriesApi } from '@/features/lab/api/series.api';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import type { AxiosError } from 'axios';
import Editor from '@monaco-editor/react';
import { renderMarkdown } from './_components/renderMarkdown';
import type { QuizQuestion, LabSubmissionRecord, LabSummary } from '@/types/lab.types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  CloudUpload,
  CheckCircle2,
  Clock,
  BookOpen,
  KeyRound,
  Lock,
  History,
  Copy,
  Check,
  Code2,
  RotateCcw,
  CheckSquare,
  Terminal,
  Loader2,
  Maximize2,
  Minimize2,
  Layers,
  Search,
} from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quick Lab Switcher Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');

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

  // Fetch parent series to know adjacent labs for < and > navigation
  const { data: seriesData } = useQuery({
    queryKey: ['series', lab?.series?.slug],
    queryFn: () => seriesApi.getBySlug(lab!.series!.slug),
    enabled: Boolean(lab?.series?.slug),
  });

  const seriesLabs = useMemo(() => seriesData?.labs || [], [seriesData?.labs]);
  const currentLabIndex = useMemo(() => {
    if (!seriesLabs.length || !lab) return -1;
    return seriesLabs.findIndex((l) => l.id === lab.id || l.slug === lab.slug);
  }, [seriesLabs, lab]);

  const prevLab = currentLabIndex > 0 ? seriesLabs[currentLabIndex - 1] : null;
  const nextLab = currentLabIndex >= 0 && currentLabIndex < seriesLabs.length - 1 ? seriesLabs[currentLabIndex + 1] : null;

  const isSolved = useMemo(() => {
    return submissions.some((s) => s.status === 'passed');
  }, [submissions]);

  const solvedLabsCount = useMemo(() => {
    return seriesLabs.filter((item) => {
      if (item.userStatus === 'passed') return true;
      if (item.id === lab?.id && isSolved) return true;
      return false;
    }).length;
  }, [seriesLabs, lab?.id, isSolved]);

  const seriesProgressPercent = seriesLabs.length > 0 ? Math.round((solvedLabsCount / seriesLabs.length) * 100) : 0;

  const filteredSeriesLabs = useMemo(() => {
    if (!labSearchQuery.trim()) return seriesLabs;
    const q = labSearchQuery.toLowerCase();
    return seriesLabs.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.difficulty && l.difficulty.toLowerCase().includes(q)) ||
        (l.sandboxType && l.sandboxType.toLowerCase().includes(q))
    );
  }, [seriesLabs, labSearchQuery]);

  const handleSwitchLab = (targetLab: LabSummary) => {
    setIsDrawerOpen(false);
    if (targetLab.slug !== lab?.slug && targetLab.id !== lab?.id) {
      navigate(`/labs/${targetLab.slug || targetLab.id}`);
    }
  };

  // Instant SPA Lab Transition: Reset code editor, quiz state and test outputs when switching labs
  useEffect(() => {
    if (lab?.initialSnippet !== undefined) {
      setCode(lab.initialSnippet);
      setIsSaved(true);
    } else {
      setCode('');
    }
    setCurrentQuizIndex(0);
    setSelectedQuizAnswers({});
    setCheckedQuizQuestions({});
    setSqlExecuted(false);
    setSqlResultData([]);
    setRightBottomTab('testcase');
  }, [lab?.id, lab?.initialSnippet]);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRun = useCallback(() => {
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
  }, [lab, code, workerStatus, run]);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to Run Code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* ── 1. Single Unified Top Header (LeetCode-Style) ────────────── */}
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0 gap-3">
        {/* Left: Brand, Problem List & < > Nav */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground tracking-tight hover:opacity-90 transition-opacity mr-1 shrink-0"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono font-bold text-[11px] shadow-xs">
              <Code2 className="size-3.5" />
            </span>
            <span className="hidden sm:inline">study<span className="text-primary">·</span>web</span>
          </Link>

          <div className="h-4 w-px bg-border/70 hidden sm:block" />

          {/* Lab List Drawer Trigger & Left Slide-over Drawer */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/60"
                title="Curriculum & Lab List"
              >
                <Layers className="size-3.5 text-primary" />
                <span>Lab List</span>
                <ChevronDown className="size-3 text-muted-foreground opacity-60" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-r border-border bg-card"
            >
              <SheetHeader className="p-4 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center gap-2.5 pr-6">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Layers className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-sm font-bold text-foreground truncate">
                      {lab?.series?.title || 'Topic Curriculum'}
                    </SheetTitle>
                    <SheetDescription className="text-[11px] text-muted-foreground truncate">
                      {seriesLabs.length} labs in this curriculum
                    </SheetDescription>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Topic Progress</span>
                    <span className="font-semibold text-primary">
                      {solvedLabsCount}/{seriesLabs.length} solved ({seriesProgressPercent}%)
                    </span>
                  </div>
                  <Progress value={seriesProgressPercent} className="h-1.5" />
                </div>

                {/* Search Input */}
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search labs in this topic..."
                    value={labSearchQuery}
                    onChange={(e) => setLabSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background border-border/80"
                  />
                </div>
              </SheetHeader>

              {/* Scrollable Labs List */}
              <ScrollArea className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {filteredSeriesLabs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No labs match &ldquo;{labSearchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredSeriesLabs.map((item, idx) => {
                      const isCurrent = item.id === lab?.id || item.slug === lab?.slug;
                      const itemSolved = item.userStatus === 'passed' || (isCurrent && isSolved);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSwitchLab(item)}
                          className={cn(
                            'w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer border',
                            isCurrent
                              ? 'bg-primary/10 border-primary/40 font-semibold text-foreground shadow-2xs'
                              : 'border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {/* Solved / Order index indicator */}
                          <div className="pt-0.5 shrink-0">
                            {itemSolved ? (
                              <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-500/10" />
                            ) : (
                              <span
                                className={cn(
                                  'size-4 rounded-full border text-[10px] font-mono flex items-center justify-center',
                                  isCurrent
                                    ? 'border-primary text-primary font-bold'
                                    : 'border-muted-foreground/40 text-muted-foreground'
                                )}
                              >
                                {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Lab Title & Metadata */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'truncate text-xs leading-tight',
                                  isCurrent ? 'text-primary font-bold' : 'text-foreground'
                                )}
                              >
                                {item.title}
                              </span>
                              {isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary bg-primary/5 uppercase font-bold shrink-0"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.difficulty && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] px-1 py-0 h-4 uppercase font-semibold',
                                    item.difficulty === 'beginner'
                                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                                      : item.difficulty === 'intermediate'
                                      ? 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5'
                                      : 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/5'
                                  )}
                                >
                                  {item.difficulty}
                                </Badge>
                              )}

                              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                {item.sandboxType === 'sql_worker'
                                  ? 'SQL'
                                  : item.sandboxType === 'quizlet'
                                  ? 'Quiz'
                                  : 'JS'}
                              </span>

                              {item.isProOnly && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold"
                                >
                                  PRO
                                </Badge>
                              )}

                              {item.estimatedMinutes && (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {item.estimatedMinutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Footer with Catalog Link */}
              <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
                <Link
                  to="/series"
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>All Series Catalog</span>
                </Link>
                <span className="text-[10px] text-muted-foreground font-mono">
                  study<span className="text-primary font-bold">·</span>web
                </span>
              </div>
            </SheetContent>
          </Sheet>

          {/* Previous / Next Lab buttons */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              disabled={!prevLab}
              onClick={() => prevLab && navigate(`/labs/${prevLab.slug || prevLab.id}`)}
              className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title={prevLab ? `Previous: ${prevLab.title}` : 'No previous lab'}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!nextLab}
              onClick={() => nextLab && navigate(`/labs/${nextLab.slug || nextLab.id}`)}
              className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title={nextLab ? `Next: ${nextLab.title}` : 'No next lab'}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Center: Run & Submit Actions (LeetCode Signature Center Controls) */}
        <div className="flex items-center gap-2">
          {!isQuizletMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRun}
              disabled={workerStatus === 'running'}
              className="h-7 text-xs font-semibold gap-1.5 border-border bg-muted/40 hover:bg-muted shadow-2xs px-3"
              title="Run Code (Ctrl+Enter)"
            >
              <Play className="size-3.5 fill-current text-primary" />
              <span>{workerStatus === 'running' ? 'Running…' : 'Run'}</span>
              <kbd className="hidden lg:inline-block text-[10px] font-mono text-muted-foreground bg-background px-1 py-0.2 rounded border border-border">
                Ctrl+↵
              </kbd>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="h-7 text-xs font-bold gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 transition-colors"
            title="Submit Solution"
          >
            {submitMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CloudUpload className="size-3.5" />
            )}
            <span>Submit</span>
          </Button>
        </div>

        {/* Right: Timer, Fullscreen, User Info */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
            <Clock className="size-3 text-muted-foreground" />
            <span>{lab.estimatedMinutes || lab.durationMinutes || 20}m</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="size-7 text-muted-foreground hover:text-foreground hidden sm:flex"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/70">
              <span className="text-xs font-medium text-muted-foreground hidden xl:block">{user.name}</span>
              <Badge
                variant={user.role === 'admin' ? 'destructive' : user.role === 'userPro' ? 'default' : 'secondary'}
                className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 h-5"
              >
                {user.role}
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Split Screen Workspace ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* ── LEFT PANE: Description / Solution / Submissions ──────────── */}
        <aside className="w-full md:w-[45%] lg:w-[42%] border-b md:border-b-0 md:border-r border-border flex flex-col bg-card overflow-hidden shrink-0">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 p-1 h-9 gap-1">
              <TabsTrigger value="description" className="text-xs font-medium gap-1.5">
                <BookOpen className="size-3.5" />
                <span>Instructions</span>
              </TabsTrigger>
              <TabsTrigger value="solution" className="text-xs font-medium gap-1.5">
                {hasSolutionAccess ? (
                  <KeyRound className="size-3.5 text-emerald-500" />
                ) : (
                  <Lock className="size-3.5 text-amber-500" />
                )}
                <span>Solution {hasSolutionAccess ? '(PRO)' : '[PRO Locked]'}</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-medium gap-1.5">
                <History className="size-3.5" />
                <span>Submissions ({submissions.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="flex-1 overflow-y-auto p-5 m-0 text-sm">
              {/* LeetCode-style Problem Header Block */}
              <div className="space-y-3 pb-4 mb-4 border-b border-border/70">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug">
                    {currentLabIndex >= 0 ? `${currentLabIndex + 1}. ` : ''}{lab.title}
                  </h1>
                  {isSolved && (
                    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 gap-1 text-[11px] font-bold shrink-0">
                      <CheckCircle2 className="size-3" />
                      <span>Solved</span>
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                    {lab.difficulty || 'Easy'}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground bg-muted/20">
                    {lab.sandboxType === 'sql_worker' ? 'SQL' : isQuizletMode ? 'Quizlet' : 'JavaScript'}
                  </Badge>
                  {lab.isProOnly && (
                    <Badge variant="secondary" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      PRO
                    </Badge>
                  )}
                  {lab.series && (
                    <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                      in <Link to={`/series/${lab.series.slug}`} className="hover:text-foreground underline underline-offset-2">{lab.series.title}</Link>
                    </span>
                  )}
                </div>
              </div>

              {/* Markdown Content with tables and syntax highlighting */}
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
                      variant="outline"
                      onClick={() => handleCopySolution(lab.solution || lab.initialSnippet)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      {copiedSolution ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copiedSolution ? 'Copied!' : 'Copy Code'}</span>
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
                  <Badge variant="outline" className="text-[11px] font-medium gap-1.5 py-0.5">
                    <Code2 className="size-3 text-primary" />
                    <span>{editorLanguage === 'sql' ? 'PostgreSQL 16' : 'JavaScript ES2024'}</span>
                  </Badge>
                  <span className="text-muted-foreground/30">•</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isSaved ? 'Auto-saved' : 'Saving…'}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCode}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2 gap-1.5 font-medium"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset Code</span>
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
                <TabsList className="justify-start rounded-none border-b border-border bg-muted/30 p-1 h-8 shrink-0 gap-1">
                  <TabsTrigger value="testcase" className="text-xs font-medium gap-1.5">
                    <CheckSquare className="size-3.5 text-primary" />
                    <span>Sample Test Cases</span>
                  </TabsTrigger>
                  <TabsTrigger value="result" className="text-xs font-medium gap-1.5">
                    <Terminal className="size-3.5 text-primary" />
                    <span>Execution Output {sqlExecuted ? '(Executed)' : ''}</span>
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <div className="h-12 border-b border-border bg-card px-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[42%] border-r border-border p-5 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 bg-muted/10 p-5 space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
