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
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import { useLabWorkspaceData } from '@/features/lab/hooks/useLabWorkspaceData';
import { useLabNavigation } from '@/features/lab/hooks/useLabNavigation';
import { useLabSubmission } from '@/features/lab/hooks/useLabSubmission';
import { getWorkspaceStrategy } from '@/features/lab/strategies/workspaceRegistry';
import { LabTheoryPane } from './_components/LabTheoryPane';
import { CurriculumDrawerSheet } from './_components/CurriculumDrawerSheet';
import { CompletionCelebrationDialog } from './_components/CompletionCelebrationDialog';
import { WorkspaceSkeleton } from './_components/WorkspaceSkeleton';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
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

  // Sync initial starter snippet on lab load or transition
  useEffect(() => {
    if (normalizedLab?.envelope.initialSnippet !== undefined) {
      setCode(normalizedLab.envelope.initialSnippet);
    } else if (rawLab?.initialSnippet !== undefined) {
      setCode(rawLab.initialSnippet);
    } else {
      setCode('');
    }
    setLeftTab('description');
  }, [normalizedLab?.id, normalizedLab?.slug, rawLab?.id, rawLab?.slug]);

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

  // 5. Strategy resolution for right pane
  const StrategyWorkspace = getWorkspaceStrategy(normalizedLab.sandboxType);

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

      {/* ── 2-Column Split Workspace (Resizable) ────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="study-web-lab-horizontal-split"
          className="flex-1 min-h-0 w-full"
        >
          {/* Left column: Theory & Instructions */}
          <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="flex flex-col min-w-0">
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

          {/* Right column: Strategy-specific workspace */}
          <ResizablePanel defaultSize="60%" minSize="30%" className="flex flex-col min-w-0">
            <main className="h-full w-full flex flex-col min-w-0 bg-background overflow-hidden">
              <Suspense fallback={<WorkspaceSkeleton />}>
                <StrategyWorkspace
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
      </div>

      {/* ── Completion & Upgrade Modals ──────────────────────────────────── */}
      <CompletionCelebrationDialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        nextLab={nextLab}
        series={series}
      />
      <UpgradeModal open={showUpgrade} labTitle={rawLab.title} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
