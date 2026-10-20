import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { renderMarkdown } from './renderMarkdown';
import type { PracticeLabV1, LabDetail, LabSeries, LabSubmissionRecord } from '@/types/lab.types';

export interface LabTheoryPaneProps {
  lab: PracticeLabV1 | LabDetail;
  series?: LabSeries;
  currentLabIndex?: number;
  isSolved?: boolean;
  submissions?: LabSubmissionRecord[];
  isLoadingSubmissions?: boolean;
  hasSolutionAccess?: boolean;
  onSelectSubmissionCode?: (code: string) => void;
  onUpgradeClick?: () => void;
  activeTab?: 'description' | 'solution' | 'history';
  onTabChange?: (tab: 'description' | 'solution' | 'history') => void;
  contextualSlot?: React.ReactNode;
  className?: string;
}

export function LabTheoryPane({
  lab,
  series,
  currentLabIndex = -1,
  isSolved = false,
  submissions = [],
  isLoadingSubmissions = false,
  hasSolutionAccess = false,
  onSelectSubmissionCode,
  onUpgradeClick,
  activeTab,
  onTabChange,
  contextualSlot,
  className,
}: LabTheoryPaneProps) {
  const [internalTab, setInternalTab] = useState<'description' | 'solution' | 'history'>('description');
  const [copiedSolution, setCopiedSolution] = useState(false);

  const instructions = 'envelope' in lab ? lab.envelope.instructions : lab.instructions || '';
  const solution = 'envelope' in lab ? lab.envelope.solution : lab.solution;
  const sandboxType = lab.sandboxType || 'js_worker';
  const difficulty = 'difficulty' in lab ? (lab as any).difficulty : 'Beginner';
  const isQuiz = (sandboxType as string) === 'quizlet' || (sandboxType as string) === 'quiz';

  const currentTab = isQuiz && (activeTab ?? internalTab) === 'solution' ? 'description' : (activeTab ?? internalTab);
  const handleTabChange = (val: string) => {
    if (isQuiz && val === 'solution') return;
    const tabVal = val as 'description' | 'solution' | 'history';
    setInternalTab(tabVal);
    onTabChange?.(tabVal);
  };

  const handleCopySolution = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2000);
    });
  };

  return (
    <aside
      className={
        className ||
        'w-full md:w-[45%] lg:w-[42%] border-b md:border-b-0 md:border-r border-border flex flex-col bg-card overflow-hidden shrink-0'
      }
    >
      <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 p-1 h-9 gap-1 overflow-x-auto no-scrollbar shrink-0 flex items-center">
          <TabsTrigger
            value="description"
            className="text-xs font-medium px-2.5 sm:px-3 shrink-0 whitespace-nowrap"
            aria-label="Instructions"
          >
            Instructions
          </TabsTrigger>
          {!isQuiz && (
            <TabsTrigger
              value="solution"
              className="text-xs font-medium px-2.5 sm:px-3 shrink-0 whitespace-nowrap flex items-center gap-1.5"
              aria-label={`Solution ${hasSolutionAccess ? '(PRO)' : '[PRO Locked]'}`}
            >
              <span>Solution</span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1 py-0 h-3.5 font-bold ${
                  hasSolutionAccess
                    ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                }`}
              >
                PRO
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="history"
            className="text-xs font-medium px-2.5 sm:px-3 shrink-0 whitespace-nowrap flex items-center gap-1"
            aria-label={`Submissions (${submissions.length})`}
          >
            <span>Submissions</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              ({submissions.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="flex-1 overflow-y-auto p-5 m-0 text-sm">
          {/* Header block */}
          <div className="space-y-3 pb-4 mb-4 border-b border-border/70">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug">
                {currentLabIndex >= 0 ? `${currentLabIndex + 1}. ` : ''}
                {lab.title}
              </h1>
              {isSolved && (
                <Badge
                  variant="outline"
                  className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 gap-1 text-[11px] font-bold shrink-0"
                >
                  <CheckCircle2 className="size-3" />
                  <span>Solved</span>
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
              >
                {difficulty || 'Easy'}
              </Badge>
              <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground bg-muted/20">
                {sandboxType === 'sql_worker' ? 'SQL' : sandboxType === 'quizlet' ? 'Quizlet' : 'JavaScript'}
              </Badge>
              {lab.isProOnly && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  PRO
                </Badge>
              )}
              {series && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                  in{' '}
                  <Link
                    to={`/series/${series.slug}`}
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    {series.title}
                  </Link>
                </span>
              )}
            </div>
          </div>

          {/* Contextual slot (e.g. CheatSheet, SQL Schema table, etc.) */}
          {contextualSlot && <div className="mb-4">{contextualSlot}</div>}

          {/* Theory / Instructions markdown body */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(instructions) }}
          />
        </TabsContent>

        {!isQuiz && (
          <TabsContent value="solution" className="flex-1 overflow-y-auto p-5 m-0 text-sm">
            {hasSolutionAccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  >
                    Verified Reference Solution (PRO)
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopySolution(solution || '')}
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
                  <code>{solution || '-- Solution will appear here'}</code>
                </pre>

                <div className="text-xs text-muted-foreground space-y-1 bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="font-semibold text-foreground">Explanation & Best Practices:</p>
                  <p>
                    Review the implementation above and ensure edge conditions, boundary values, and performance limits are accounted for.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                <Badge
                  variant="secondary"
                  className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20"
                >
                  PRO CONTENT
                </Badge>
                <p className="font-bold text-sm text-foreground">Exclusive to PRO Accounts</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  View detailed solutions, clean code breakdown, and best practices to accelerate your learning.
                </p>
                <Button
                  size="sm"
                  onClick={onUpgradeClick}
                  className="text-xs font-semibold"
                >
                  Unlock PRO Solution
                </Button>
              </div>
            )}
          </TabsContent>
        )}

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
                Complete your solution and submit to record your first attempt.
              </p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  if (sub.submittedCode && onSelectSubmissionCode) {
                    onSelectSubmissionCode(sub.submittedCode);
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
                    <span className="text-muted-foreground text-[11px] font-medium">
                      {sub.executionTimeMs}ms
                    </span>
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
  );
}
