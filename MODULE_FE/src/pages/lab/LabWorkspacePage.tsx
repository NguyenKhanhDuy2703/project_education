/**
 * LabWorkspacePage — /labs/:labId
 *
 * Lightweight Orchestration Shell (<250 lines):
 * - Decomposed data queries via useLabWorkspaceData
 * - Curriculum navigation & drawer search via useLabNavigation
 * - Submission mutation & celebration via useLabSubmission
 * - Shared Theory Pane via LabTheoryPane
 * - Pluggable Right Pane via getWorkspaceStrategy(sandboxType)
 */
import { Suspense, createElement, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContainerBreakpoint } from '@/hooks/useContainerBreakpoint';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import { useLabWorkspaceData } from '@/features/lab/hooks/useLabWorkspaceData';
import { useLabNavigation } from '@/features/lab/hooks/useLabNavigation';
import { useLabSubmission } from '@/features/lab/hooks/useLabSubmission';
import { getWorkspaceStrategy } from '@/features/lab/strategies/workspaceRegistry';
import type { WorkspaceStrategyProps } from '@/features/lab/strategies/workspaceStrategy.types';
import { LabTheoryPane } from './_components/LabTheoryPane';
import { CurriculumDrawerSheet } from './_components/CurriculumDrawerSheet';
import { CompletionCelebrationDialog } from './_components/CompletionCelebrationDialog';
import { WorkspaceSkeleton } from './_components/WorkspaceSkeleton';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
import { inferLearningUnitType } from '@/features/lab/domain/labContentCodec';
import { getUnitTypeInfo, isAutomationSeriesSlug, isAutomationContentHidden } from '@/services/formatBadge.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';

type WorkspaceStrategyRendererProps = WorkspaceStrategyProps & {
  sandboxType: string;
  envelopeVersion?: string;
};

function WorkspaceStrategyRenderer({
  sandboxType,
  envelopeVersion,
  ...workspaceProps
}: WorkspaceStrategyRendererProps) {
  return createElement(getWorkspaceStrategy(sandboxType, envelopeVersion), workspaceProps);
}

export function LabWorkspacePage() {
  const { labId } = useParams<{ labId: string }>();
  const { user } = useAppSelector((s) => s.auth);

  const hasLabProAccess = can(user, 'LAB_PRO');
  const hasSolutionAccess = can(user, 'SOLUTION_ACCESS');

  // 1. Data fetching & domain normalization
  const {
    rawLab,
    normalizedLab,
    series,
    submissions,
    isSolved,
    isLoading,
    error,
    is403,
  } = useLabWorkspaceData(labId);

  // 2. Navigation & drawer search
  const seriesLabs = series?.labs || [];
  const {
    currentLabIndex,
    prevLab,
    nextLab,
    isDrawerOpen,
    setIsDrawerOpen,
    labSearchQuery,
    setLabSearchQuery,
    filteredSeriesLabs,
    handleSwitchLab,
  } = useLabNavigation({
    seriesLabs,
    currentLab: rawLab,
  });

  // 3. Submission management
  const {
    isSubmitting,
    showSuccessModal,
    setShowSuccessModal,
    submitAttempt,
  } = useLabSubmission({ labId: rawLab?.id || labId });

  // 4. Local workspace state
  const [code, setCode] = useState('');
  const [leftTab, setLeftTab] = useState<'description' | 'solution' | 'history'>('description');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive container & layout presets for SQL Practice
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const { breakpoint: workspaceBreakpoint } = useContainerBreakpoint(workspaceContainerRef);
  const [sqlLayoutPreset, setSqlLayoutPreset] = useState<'reading' | 'split' | 'practice'>('split');
  const [sqlLayoutCounter, setSqlLayoutCounter] = useState(0);
  const [sqlMobileTab, setSqlMobileTab] = useState<'theory' | 'sql'>('theory');

  const handleSelectPreset = (preset: 'reading' | 'split' | 'practice') => {
    setSqlLayoutPreset(preset);
    try {
      const leftSize = preset === 'reading' ? 65 : preset === 'practice' ? 25 : 45;
      const rightSize = 100 - leftSize;
      localStorage.setItem(
        'study-web:panels:study-web-lab-horizontal-split',
        JSON.stringify({ 'sql-theory-panel': leftSize, 'sql-workspace-panel': rightSize })
      );
    } catch {}
    setSqlLayoutCounter((c) => c + 1);
  };

  // Sync initial starter snippet on lab load or transition
  /* eslint-disable react/set-state-in-effect -- route/data changes intentionally reset editor state */
  useEffect(() => {
    // The selected lab is an external route/data source; changing it intentionally resets editor state.
    if (normalizedLab?.envelope.initialSnippet !== undefined) {
      setCode(normalizedLab.envelope.initialSnippet);
    } else if (rawLab?.initialSnippet !== undefined) {
      setCode(rawLab.initialSnippet);
    } else {
      setCode('');
    }
    setLeftTab('description');
  }, [
    normalizedLab?.id,
    normalizedLab?.slug,
    normalizedLab?.envelope.initialSnippet,
    rawLab?.id,
    rawLab?.slug,
    rawLab?.initialSnippet,
  ]);
  /* eslint-enable react/set-state-in-effect */

  const handleResetCode = useCallback(() => {
    const starter = normalizedLab?.envelope.initialSnippet ?? rawLab?.initialSnippet;
    if (starter !== undefined && window.confirm('Are you sure you want to reset code to starter snippet?')) {
      setCode(starter);
    }
  }, [normalizedLab, rawLab]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isBlockedProLab = Boolean(
    (rawLab?.isProOnly || normalizedLab?.isProOnly) && !hasLabProAccess
  );

  // ── Guard: 403 Forbidden / PRO Gate ────────────────────────────────────────
  if (is403 || isBlockedProLab) {
    return (
      <>
        <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-4">
          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Exclusive PRO Lab Workspace
          </Badge>
          <h2 className="text-xl font-bold text-foreground">
            {rawLab?.title || 'Interactive Lab Challenge'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This premium practice challenge requires an active PRO membership. Upgrade your account to unlock interactive exercises, solutions, and community submissions.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="default" onClick={() => setShowUpgrade(true)}>
              Unlock with PRO
            </Button>
            <Button variant="outline" asChild>
              <Link to="/series">Browse Free Labs</Link>
            </Button>
          </div>
        </div>
        <UpgradeModal open={showUpgrade} labTitle={rawLab?.title} onClose={() => setShowUpgrade(false)} />
      </>
    );
  }

  // ── Guard: Loading Skeleton ────────────────────────────────────────────────
  if (isLoading) return <WorkspaceSkeleton />;

    const isHiddenAutomationLab = Boolean(
    isAutomationContentHidden(user?.role) &&
      (isAutomationSeriesSlug(labId) ||
        isAutomationSeriesSlug(series?.slug) ||
        (rawLab && (rawLab.sandboxType as string) === 'automation_v3') ||
        (rawLab && isAutomationSeriesSlug(rawLab.slug)))
  );

  if (isHiddenAutomationLab || ((error || !rawLab) && isAutomationSeriesSlug(labId))) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-6">
        <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="size-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30">
            Curriculum Notice
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Lab Challenge Temporarily Unavailable
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Automation testing challenges are temporarily unavailable in this release as we curate our new Playwright experience.
            Please explore our PostgreSQL Business Labs or Testing Theory Quizzes in the active catalog.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="min-h-[44px] px-6 font-semibold shadow-sm">
            <Link to="/series">Browse Active Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Guard: Data Load Error ─────────────────────────────────────────────────
  if (error || !rawLab || !normalizedLab) {
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

  // 5. Strategy resolution for workspace
  const resolvedUnitType = inferLearningUnitType(normalizedLab.unitType, normalizedLab.sandboxType);
  const unitInfo = getUnitTypeInfo(resolvedUnitType, normalizedLab.sandboxType);
  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-background">
      {/* ── Top Header Toolbar ────────────────────────────────────────────── */}
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0 gap-3">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground tracking-tight hover:opacity-90 transition-opacity mr-1 shrink-0"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono font-bold text-[11px] shadow-xs">
              <Code2 className="size-3.5" />
            </span>
            <span className="hidden sm:inline">
              study<span className="text-primary">·</span>web
            </span>
          </Link>

          <div className="h-4 w-px bg-border/70 hidden sm:block" />

          {/* Curriculum drawer sheet */}
          <CurriculumDrawerSheet
            series={series}
            currentLabId={rawLab.id}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            labSearchQuery={labSearchQuery}
            setLabSearchQuery={setLabSearchQuery}
            filteredSeriesLabs={filteredSeriesLabs}
            onSwitchLab={handleSwitchLab}
          />

          {/* Pedagogical Unit Type Badge */}
          <Badge
            variant="outline"
            className={cn('text-[11px] font-semibold hidden md:inline-flex shrink-0', unitInfo.badgeClass)}
          >
            {unitInfo.label}
          </Badge>

          {/* Prev / Next Lab navigation */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              disabled={!prevLab}
              onClick={() => prevLab && handleSwitchLab(prevLab)}
              className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title={prevLab ? `Previous: ${prevLab.title}` : 'No previous lab'}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!nextLab}
              onClick={() => nextLab && handleSwitchLab(nextLab)}
              className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title={nextLab ? `Next: ${nextLab.title}` : 'No next lab'}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons for SQL Practice */}
          {resolvedUnitType === 'sql_practice' && workspaceBreakpoint !== 'small' && (
            <div className="hidden lg:flex items-center bg-muted/60 rounded-md p-0.5 border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => handleSelectPreset('reading')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  sqlLayoutPreset === 'reading'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Reading focus: 65% Theory, 35% SQL"
              >
                Reading focus
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('split')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  sqlLayoutPreset === 'split'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Balanced split: 45% Theory, 55% SQL"
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('practice')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  sqlLayoutPreset === 'practice'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Practice focus: 25% Theory, 75% SQL"
              >
                Practice focus
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
            <Clock className="size-3 text-muted-foreground" />
            <span>{rawLab.estimatedMinutes || rawLab.durationMinutes || 20}m</span>
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

      {/* ── Main Workspace: 4 Pedagogical Patterns ───────────────────────── */}
      {resolvedUnitType === 'sql_practice' || (normalizedLab.sandboxType === 'js_worker' && normalizedLab.envelope?.version !== '3.0') ? (
        <div ref={workspaceContainerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {workspaceBreakpoint === 'small' ? (
            /* Responsive Tabs for mobile/small container (Pattern 1) */
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex h-11 border-b border-border bg-muted/20 px-2 items-center justify-around shrink-0 md:hidden">
                <button
                  type="button"
                  onClick={() => setSqlMobileTab('theory')}
                  className={cn(
                    'text-xs font-medium px-4 py-2 min-h-[44px] min-w-[44px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    sqlMobileTab === 'theory'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  Theory &amp; Task
                </button>
                <button
                  type="button"
                  onClick={() => setSqlMobileTab('sql')}
                  className={cn(
                    'text-xs font-medium px-4 py-2 min-h-[44px] min-w-[44px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    sqlMobileTab === 'sql'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  SQL Workspace
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {sqlMobileTab === 'theory' ? (
                  <LabTheoryPane
                    lab={normalizedLab}
                    series={series}
                    currentLabIndex={currentLabIndex}
                    isSolved={isSolved}
                    submissions={submissions}
                    hasSolutionAccess={hasSolutionAccess}
                    activeTab={leftTab}
                    onTabChange={setLeftTab}
                    onSelectSubmissionCode={(subCode) => setCode(subCode)}
                    onUpgradeClick={() => setShowUpgrade(true)}
                    className="w-full h-full border-r-0 border-b-0 flex flex-col bg-card overflow-hidden shrink-0"
                  />
                ) : (
                  <main className="h-full w-full flex flex-col min-w-0 bg-background overflow-hidden">
                    <Suspense fallback={<WorkspaceSkeleton />}>
                      <WorkspaceStrategyRenderer
                        key={normalizedLab.id}
                        sandboxType={normalizedLab.sandboxType}
                        envelopeVersion={normalizedLab.envelope?.version}
                        lab={normalizedLab}
                        code={code}
                        onCodeChange={setCode}
                        onSubmit={submitAttempt}
                        isSubmitting={isSubmitting}
                        onResetCode={handleResetCode}
                      />
                    </Suspense>
                  </main>
                )}
              </div>
            </div>
          ) : (
            <ResizablePanelGroup
              key={`sql-split-${sqlLayoutPreset}-${sqlLayoutCounter}`}
              direction="horizontal"
              autoSaveId="study-web-lab-horizontal-split"
              className="flex-1 min-h-0 w-full"
            >
              {/* Left column: Theory & Instructions */}
              <ResizablePanel
                id="sql-theory-panel"
                defaultSize={sqlLayoutPreset === 'reading' ? '65%' : sqlLayoutPreset === 'practice' ? '25%' : '45%'}
                minSize="20%"
                maxSize="75%"
                className="flex flex-col min-w-0"
              >
                <LabTheoryPane
                  lab={normalizedLab}
                  series={series}
                  currentLabIndex={currentLabIndex}
                  isSolved={isSolved}
                  submissions={submissions}
                  hasSolutionAccess={hasSolutionAccess}
                  activeTab={leftTab}
                  onTabChange={setLeftTab}
                  onSelectSubmissionCode={(subCode) => setCode(subCode)}
                  onUpgradeClick={() => setShowUpgrade(true)}
                  className="w-full h-full border-r-0 border-b-0 flex flex-col bg-card overflow-hidden shrink-0"
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right column: SQL workspace */}
              <ResizablePanel
                id="sql-workspace-panel"
                defaultSize={sqlLayoutPreset === 'reading' ? '35%' : sqlLayoutPreset === 'practice' ? '75%' : '55%'}
                minSize="25%"
                className="flex flex-col min-w-0"
              >
                <main className="h-full w-full flex flex-col min-w-0 bg-background overflow-hidden">
                  <Suspense fallback={<WorkspaceSkeleton />}>
                    <WorkspaceStrategyRenderer
                      key={normalizedLab.id}
                      sandboxType={normalizedLab.sandboxType}
                      envelopeVersion={normalizedLab.envelope?.version}
                      lab={normalizedLab}
                      code={code}
                      onCodeChange={setCode}
                      onSubmit={submitAttempt}
                      isSubmitting={isSubmitting}
                      onResetCode={handleResetCode}
                    />
                  </Suspense>
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      ) : (
        /* Dedicated full-width layout for Theory lessons, Checkpoints, and Automation labs */
        <main className="flex-1 min-h-0 w-full flex flex-col bg-background overflow-hidden">
          <Suspense fallback={<WorkspaceSkeleton />}>
            <WorkspaceStrategyRenderer
              key={normalizedLab.id}
              sandboxType={normalizedLab.sandboxType}
              envelopeVersion={normalizedLab.envelope?.version}
              lab={normalizedLab}
              code={code}
              onCodeChange={setCode}
              onSubmit={submitAttempt}
              isSubmitting={isSubmitting}
              onResetCode={handleResetCode}
            />
          </Suspense>
        </main>
      )}

      {/* ── Completion & Upgrade Modals ──────────────────────────────────── */}
      <CompletionCelebrationDialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        nextLab={nextLab}
        series={series}
        unitType={resolvedUnitType}
      />
      <UpgradeModal open={showUpgrade} labTitle={rawLab.title} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
