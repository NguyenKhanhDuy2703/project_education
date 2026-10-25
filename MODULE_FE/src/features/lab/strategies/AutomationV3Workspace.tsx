import { useState, useEffect, useMemo, useRef } from 'react';
import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/features/preferences/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Play,
  CloudUpload,
  RotateCcw,
  Code,
  Layout,
  Terminal,
  CheckCircle2,
  XCircle,
  PanelLeft,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { renderMarkdown } from '@/pages/lab/_components/renderMarkdown';
import { useContainerBreakpoint } from '@/hooks/useContainerBreakpoint';
import { BlockPalette } from '../components/v3/BlockPalette';
import { VisualStepPlanEditor } from '../components/v3/VisualStepPlanEditor';
import { MiniAppPreview } from '../components/v3/MiniAppPreview';
import { BUILTIN_BLOCK_DEFINITIONS, validateAutomationPlan } from '../runtime/v3/blockDsl';
import { SandboxedActionRunner, type RunnerExecutionResult } from '../runtime/v3/blockRunner';
import { compilePlanToPlaywrightCode } from '../runtime/v3/playwrightV3Compiler';
import { encodeAutomationV3Submission } from '../runtime/v3/automationV3SubmissionCodec';
import type { AutomationExerciseV3, AutomationStep } from '@/types/lab.types';

// Exported for focused parser tests; keeping it beside the workspace avoids duplicating the grammar.
// eslint-disable-next-line react/only-export-components
export function parsePlaywrightCodeToSteps(code: string): AutomationStep[] {
  const parsedSteps: AutomationStep[] = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('await ') && !trimmed.startsWith('page.') && !trimmed.startsWith('expect(')) return;

    // Pattern 1: await page.goto('/shop');
    const gotoMatch = trimmed.match(/await\s+page\.goto\(\s*['"]([^'"]+)['"]\s*\)/);
    if (gotoMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'nav_goto',
        category: 'navigation',
        params: { route: gotoMatch[1] },
      });
      return;
    }

    // Pattern 2: await ...fill('value');
    const fillMatch = trimmed.match(/await\s+(.+?)\.fill\(\s*['"]([^'"]*)['"]\s*\)/);
    if (fillMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'act_fill',
        category: 'action',
        params: { locator: fillMatch[1].trim(), value: fillMatch[2] },
      });
      return;
    }

    // Pattern 3: await ...check();
    const checkMatch = trimmed.match(/await\s+(.+?)\.check\(\s*\)/);
    if (checkMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'act_check',
        category: 'action',
        params: { locator: checkMatch[1].trim() },
      });
      return;
    }

    // Pattern 4: await ...selectOption('value');
    const selectMatch = trimmed.match(/await\s+(.+?)\.selectOption\(\s*['"]([^'"]*)['"]\s*\)/);
    if (selectMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'act_select_option',
        category: 'action',
        params: { locator: selectMatch[1].trim(), value: selectMatch[2] },
      });
      return;
    }

    // Pattern 5: await ...click();
    const clickMatch = trimmed.match(/await\s+(.+?)\.click\(\s*\)/);
    if (clickMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'act_click',
        category: 'action',
        params: { locator: clickMatch[1].trim() },
      });
      return;
    }

    // Pattern 6: await expect(...).toBeVisible();
    const visibleMatch = trimmed.match(/await\s+expect\(\s*(.+?)\s*\)\.toBeVisible\(\s*\)/);
    if (visibleMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'assert_visible',
        category: 'assertion',
        params: { locator: visibleMatch[1].trim() },
      });
      return;
    }

    // Pattern 7: await expect(...).toHaveText('expected');
    const textMatch = trimmed.match(/await\s+expect\(\s*(.+?)\s*\)\.toHaveText\(\s*(?:['"]([^'"]*)['"]|\/([^/]+)\/i?)\s*\)/);
    if (textMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'assert_text',
        category: 'assertion',
        params: { locator: textMatch[1].trim(), expected: textMatch[2] || textMatch[3] },
      });
      return;
    }

    // Pattern 8: await expect(page).toHaveURL('url');
    const urlMatch = trimmed.match(/await\s+expect\(\s*page\s*\)\.toHaveURL\(\s*['"]([^'"]*)['"]\s*\)/);
    if (urlMatch) {
      parsedSteps.push({
        id: `parsed_step_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        blockType: 'assert_url',
        category: 'assertion',
        params: { url: urlMatch[1] },
      });
      return;
    }
  });

  return parsedSteps;
}

export function AutomationV3Workspace({
  lab,
  code,
  onCodeChange,
  onSubmit,
  isSubmitting = false,
  onResetCode,
}: WorkspaceStrategyProps) {
  const { resolvedTheme } = useTheme();
  const envelope = lab?.envelope;
  const config = useMemo<AutomationExerciseV3>(
    () => (envelope?.config as AutomationExerciseV3 | undefined) || {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'block_builder',
      contentRevision: 'v1',
      fixture: {
        fixtureId: 'order-investigation-app',
        fixtureVersion: '1.0.0',
        initialRoute: '/orders',
      },
      allowedBlocks: Object.values(BUILTIN_BLOCK_DEFINITIONS),
      starterPlan: [],
      publicChecks: [],
      exportTemplate: 'typescript',
    },
    [envelope?.config],
  );

  const mode = config.interactionMode || 'block_builder';
  const fixtureId = config.fixture?.fixtureId || 'order-investigation-app';

  // Workspace View State
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>(() => (mode === 'full_code' ? 'code' : 'visual'));
  const [isTaskBriefOpen, setIsTaskBriefOpen] = useState(false);
  const [steps, setSteps] = useState<AutomationStep[]>(() =>
    config.starterPlan && config.starterPlan.length > 0 ? [...config.starterPlan] : [],
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasRunSinceEdit, setHasRunSinceEdit] = useState(false);
  const [executionResult, setExecutionResult] = useState<RunnerExecutionResult | null>(null);
  const [currentRoute, setCurrentRoute] = useState(config.fixture?.initialRoute || '/');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Sync when lab changes
  useEffect(() => {
    if (config?.starterPlan) {
      // This effect intentionally resets local editor state when the selected lab contract changes.
      // eslint-disable-next-line react/set-state-in-effect
      setSteps([...config.starterPlan]);
      setHasRunSinceEdit(false);
      setExecutionResult(null);
      setCurrentRoute(config.fixture?.initialRoute || '/');
      const compiled = compilePlanToPlaywrightCode(config, config.starterPlan);
      onCodeChange(compiled);
    }
  }, [config, lab?.id, lab?.slug, onCodeChange]);

  // Handle plan modifications
  const handleAddBlock = (blockType: string) => {
    const def = config.allowedBlocks.find((b) => b.blockType === blockType) || BUILTIN_BLOCK_DEFINITIONS[blockType];
    if (!def) return;

    const defaultParams: Record<string, any> = {};
    def.parameters.forEach((p) => {
      defaultParams[p.id] = p.defaultValue ?? '';
    });

    const newStep: AutomationStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      blockType,
      category: def.category,
      params: defaultParams,
    };

    const nextSteps = [...steps, newStep];
    setSteps(nextSteps);
    setHasRunSinceEdit(false);

    const compiled = compilePlanToPlaywrightCode(config, nextSteps);
    onCodeChange(compiled);
  };

  const handleUpdateStepParams = (stepId: string, paramId: string, val: any) => {
    const nextSteps = steps.map((s) => (s.id === stepId ? { ...s, params: { ...s.params, [paramId]: val } } : s));
    setSteps(nextSteps);
    setHasRunSinceEdit(false);

    if (stepErrors[stepId]) {
      const nextErrors = { ...stepErrors };
      delete nextErrors[stepId];
      setStepErrors(nextErrors);
    }

    const compiled = compilePlanToPlaywrightCode(config, nextSteps);
    onCodeChange(compiled);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const nextSteps = [...steps];
    const [moved] = nextSteps.splice(index, 1);
    nextSteps.splice(targetIdx, 0, moved);

    setSteps(nextSteps);
    setHasRunSinceEdit(false);

    const compiled = compilePlanToPlaywrightCode(config, nextSteps);
    onCodeChange(compiled);
  };

  const handleRemoveStep = (stepId: string) => {
    const nextSteps = steps.filter((s) => s.id !== stepId);
    setSteps(nextSteps);
    setHasRunSinceEdit(false);

    const compiled = compilePlanToPlaywrightCode(config, nextSteps);
    onCodeChange(compiled);
  };

  const handleReset = () => {
    if (config?.starterPlan) {
      setSteps([...config.starterPlan]);
      setHasRunSinceEdit(false);
      setExecutionResult(null);
      setCurrentRoute(config.fixture?.initialRoute || '/');
      const compiled = compilePlanToPlaywrightCode(config, config.starterPlan);
      onCodeChange(compiled);
    } else if (onResetCode) {
      onResetCode();
    }
  };

  const handleRun = async () => {
    let stepsToRun = steps;
    if (mode === 'full_code') {
      const parsed = parsePlaywrightCodeToSteps(code || '');
      if (parsed.length === 0 && (code || '').trim().length > 0) {
        setStepErrors({ code: 'No valid Playwright actions or assertions found in script.' });
        return;
      }
      stepsToRun = parsed;
      setSteps(parsed);
    }

    // 1. Validate plan
    const validation = validateAutomationPlan(stepsToRun, config.allowedBlocks);
    if (!validation.isValid) {
      const errorsByStep = stepsToRun.reduce<Record<string, string>>((result, s) => {
        const foundErr = validation.errors.find((e) => e.includes(s.blockType));
        return foundErr ? { ...result, [s.id]: foundErr } : result;
      }, {});
      const errMap = mode === 'full_code' && Object.keys(errorsByStep).length === 0
        ? { code: validation.errors.join('; ') }
        : errorsByStep;
      setStepErrors(errMap);
      return;
    }
    setStepErrors({});

    setIsRunning(true);
    setExecutionResult(null);

    const container = document.getElementById('mini-app-preview-container');
    const runner = new SandboxedActionRunner(fixtureId, container || undefined);

    const result = await runner.executePlan(stepsToRun, config.publicChecks);
    setIsRunning(false);
    setHasRunSinceEdit(true);
    setExecutionResult(result);
    setCurrentRoute(result.currentRoute);
  };

  const handleSubmit = async () => {
    if (!hasRunSinceEdit || !executionResult) {
      return;
    }

    let stepsToSubmit = steps;
    if (mode === 'full_code') {
      const parsed = parsePlaywrightCodeToSteps(code || '');
      if (parsed.length > 0) {
        stepsToSubmit = parsed;
      }
    }

    const compiled = mode === 'full_code' && code ? code : compilePlanToPlaywrightCode(config, stepsToSubmit);
    const submissionPayload = encodeAutomationV3Submission({
      version: '3.0',
      exerciseRevision: config.contentRevision || 'v1',
      stepPlan: stepsToSubmit,
      generatedCode: compiled,
      status: executionResult.passed ? 'passed' : 'failed',
      timeMs: executionResult.totalTimeMs,
      resultSummary: {
        passedChecks: executionResult.publicCheckResults.filter((c) => c.passed).map((c) => c.checkId),
        failedChecks: executionResult.publicCheckResults.filter((c) => !c.passed).map((c) => c.checkId),
        totalSteps: stepsToSubmit.length,
      },
      submittedAt: new Date().toISOString(),
    });

    await onSubmit({
      submittedCode: submissionPayload,
      status: executionResult.passed ? 'passed' : 'failed',
      timeMs: executionResult.totalTimeMs,
      testLogs: executionResult.logs.join('\n'),
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const { breakpoint } = useContainerBreakpoint(containerRef);
  const [mobileSection, setMobileSection] = useState<'palette' | 'editor' | 'preview'>('editor');
  const [isPaletteSheetOpen, setIsPaletteSheetOpen] = useState(false);
  const [layoutResetKey, setLayoutResetKey] = useState(0);

  const handleResetLayout = () => {
    try {
      localStorage.removeItem('study-web:panels:automation-v3-workspace');
      localStorage.removeItem('study-web:panels:automation-v3-workspace-medium');
      setLayoutResetKey((k) => k + 1);
    } catch {}
  };

  const renderEditorArea = () => (
    activeTab === 'visual' ? (
      <VisualStepPlanEditor
        steps={steps}
        allowedBlocks={config.allowedBlocks}
        onUpdateStepParams={handleUpdateStepParams}
        onMoveStep={handleMoveStep}
        onRemoveStep={handleRemoveStep}
        stepErrors={stepErrors}
        disabled={isRunning}
      />
    ) : (
      <div className="h-full flex flex-col bg-background">
        <div className="h-8 border-b border-border bg-muted/30 px-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground">
            {mode === 'full_code' ? 'Playwright TypeScript Test Script' : 'Generated Playwright Code (Read-Only)'}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">playwright @test</Badge>
        </div>
        {stepErrors['code'] && (
          <div className="bg-destructive/10 text-destructive text-xs px-3 py-1.5 border-b border-destructive/20 flex items-center gap-1.5 font-mono">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{stepErrors['code']}</span>
          </div>
        )}
        <div className="flex-1">
          <Editor
            height="100%"
            language="typescript"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            value={code || compilePlanToPlaywrightCode(config, steps)}
            onChange={(val) => {
              if (mode === 'full_code') {
                onCodeChange(val || '');
                setHasRunSinceEdit(false);
              }
            }}
            options={{
              readOnly: mode !== 'full_code',
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    )
  );

  const failedStep = executionResult?.stepResults.find((r) => r.status === 'failed');
  const failedStepIndex = failedStep ? executionResult?.stepResults.indexOf(failedStep) : null;
  const currentHighlightSelector = failedStep?.highlightSelector || null;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden"
      role="region"
      aria-label="Automation V3 Workspace"
    >
      {/* ── Top Control Bar ──────────────────────────────────────────────── */}
      <div className="h-10 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Client Scenario Runner
          </span>
          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
            Mode: {mode.replace('_', ' ')}
          </Badge>
          <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4">
            {steps.length}/50 steps
          </Badge>
          {!hasRunSinceEdit && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/20 bg-amber-500/10">
              Unverified edits — Run to test
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Task Brief button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTaskBriefOpen(true)}
            className="h-7 text-xs gap-1.5 px-2.5"
            title="View scenario instructions and checklist"
          >
            <FileText className="size-3.5 text-primary" />
            <span>Task Brief</span>
          </Button>

          {/* Palette button for medium screens */}
          {breakpoint === 'medium' && mode === 'block_builder' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaletteSheetOpen(true)}
              className="h-7 text-xs gap-1.5 px-2.5"
            >
              <PanelLeft className="size-3.5" />
              <span>Palette</span>
            </Button>
          )}

          {/* View Tab Switcher */}
          <div className="flex items-center bg-muted rounded p-0.5 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                activeTab === 'visual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layout className="size-3" />
              <span>Visual Steps</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                activeTab === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="size-3" />
              <span>Generated .spec.ts</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetLayout}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            title="Reset layout sizes"
          >
            <RotateCcw className="size-3" />
            <span>Reset Layout</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="h-7 text-xs gap-1 px-3 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Play className={`size-3 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Scenario...' : 'Run Scenario'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasRunSinceEdit || isRunning}
            className="h-7 text-xs gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CloudUpload className="size-3" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </Button>
        </div>
      </div>

      {/* ── Main Workspace Body ─────────────────────────────────────────── */}
      {breakpoint === 'small' ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Mobile Tab Navigation (min 44px touch targets) */}
          <div className="flex h-11 border-b border-border bg-muted/20 px-2 items-center justify-around shrink-0">
            {mode === 'block_builder' && (
              <button
                type="button"
                onClick={() => setMobileSection('palette')}
                className={`text-xs font-medium px-3 py-2 min-h-[44px] min-w-[44px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  mobileSection === 'palette' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                Palette
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileSection('editor')}
              className={`text-xs font-medium px-3 py-2 min-h-[44px] min-w-[44px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                mobileSection === 'editor' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              {activeTab === 'visual' ? 'Steps' : 'Code'}
            </button>
            <button
              type="button"
              onClick={() => setMobileSection('preview')}
              className={`text-xs font-medium px-3 py-2 min-h-[44px] min-w-[44px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                mobileSection === 'preview' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Mobile Active Section */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileSection === 'palette' && mode === 'block_builder' && (
              <div className="w-full h-full">
                <BlockPalette allowedBlocks={config.allowedBlocks} onAddBlock={handleAddBlock} disabled={isRunning} />
              </div>
            )}
            {mobileSection === 'editor' && (
              <div className="w-full h-full">
                {renderEditorArea()}
              </div>
            )}
            {mobileSection === 'preview' && (
              <div className="w-full h-full">
                <MiniAppPreview
                  fixtureId={fixtureId}
                  currentRoute={currentRoute}
                  stepResults={executionResult?.stepResults}
                  activeStepIndex={failedStepIndex}
                  highlightSelector={currentHighlightSelector}
                  onResetFixture={() => setCurrentRoute(config.fixture?.initialRoute || '/')}
                  isCollapsed={false}
                />
              </div>
            )}
          </div>
        </div>
      ) : breakpoint === 'medium' ? (
        <div className="flex-1 flex min-h-0">
          <ResizablePanelGroup
            key={`group-medium-${layoutResetKey}`}
            direction="horizontal"
            autoSaveId="automation-v3-workspace-medium"
          >
            {/* Middle: Steps Editor or Monaco Generated Code */}
            <ResizablePanel
              id="automation-v3-editor"
              defaultSize="55%"
              minSize={280}
            >
              {renderEditorArea()}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: Client Scenario Runner Mini-App Preview & Results */}
            <ResizablePanel
              id="automation-v3-preview"
              defaultSize="45%"
              minSize={260}
            >
              <MiniAppPreview
                fixtureId={fixtureId}
                currentRoute={currentRoute}
                stepResults={executionResult?.stepResults}
                activeStepIndex={failedStepIndex}
                highlightSelector={currentHighlightSelector}
                onResetFixture={() => setCurrentRoute(config.fixture?.initialRoute || '/')}
                isCollapsed={previewCollapsed}
                onToggleCollapse={() => setPreviewCollapsed(!previewCollapsed)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Palette Drawer for medium breakpoint */}
          <Sheet open={isPaletteSheetOpen} onOpenChange={setIsPaletteSheetOpen}>
            <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
              <SheetHeader className="px-4 py-3 border-b shrink-0">
                <SheetTitle className="text-sm font-semibold">Block Syntax Palette</SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <BlockPalette
                  allowedBlocks={config.allowedBlocks}
                  onAddBlock={(blockType) => {
                    handleAddBlock(blockType);
                    setIsPaletteSheetOpen(false);
                  }}
                  disabled={isRunning}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <ResizablePanelGroup
            key={`group-wide-${layoutResetKey}`}
            direction="horizontal"
            autoSaveId="automation-v3-workspace"
          >
            {/* Left: Syntax Palette (only in visual mode & block_builder) */}
            {activeTab === 'visual' && mode === 'block_builder' && (
              <>
                <ResizablePanel
                  id="automation-v3-palette"
                  defaultSize="22%"
                  minSize={220}
                  maxSize="35%"
                >
                  <BlockPalette allowedBlocks={config.allowedBlocks} onAddBlock={handleAddBlock} disabled={isRunning} />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Middle: Steps Editor or Monaco Generated Code */}
            <ResizablePanel
              id="automation-v3-editor"
              defaultSize={activeTab === 'visual' ? "45%" : "65%"}
              minSize={280}
            >
              {renderEditorArea()}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: Client Scenario Runner Mini-App Preview & Results */}
            <ResizablePanel
              id="automation-v3-preview"
              defaultSize="33%"
              minSize={260}
            >
              <MiniAppPreview
                fixtureId={fixtureId}
                currentRoute={currentRoute}
                stepResults={executionResult?.stepResults}
                activeStepIndex={failedStepIndex}
                highlightSelector={currentHighlightSelector}
                onResetFixture={() => setCurrentRoute(config.fixture?.initialRoute || '/')}
                isCollapsed={previewCollapsed}
                onToggleCollapse={() => setPreviewCollapsed(!previewCollapsed)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {/* ── Bottom Results Bar ───────────────────────────────────────────── */}
      {executionResult && (
        <div className="min-h-20 border-t border-border bg-card px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            {executionResult.passed ? (
              <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
            ) : (
              <div className="size-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <XCircle className="size-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-foreground">
                {executionResult.passed ? 'All Checks Passed!' : 'Scenario Verification Failed'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {executionResult.publicCheckResults.filter((c) => c.passed).length}/
                {executionResult.publicCheckResults.length} public checks satisfied • {executionResult.totalTimeMs}ms
              </div>
              {failedStep && (
                <div className="text-[11px] text-destructive mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Step #{ (failedStepIndex ?? 0) + 1 } ({failedStep.blockType}) failed:</span>
                  <span>{failedStep.message}</span>
                  {failedStep.expected && <span>(Expected: <code className="font-mono bg-destructive/10 px-1 py-0.5 rounded">{failedStep.expected}</code>, Actual: <code className="font-mono bg-destructive/10 px-1 py-0.5 rounded">{failedStep.actual || 'none'}</code>)</span>}
                  {failedStep.hint && <span className="text-amber-500 font-medium">💡 Gợi ý: {failedStep.hint}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {executionResult.publicCheckResults.map((chk) => (
              <Badge
                key={chk.checkId}
                variant={chk.passed ? 'secondary' : 'destructive'}
                className={`text-[10px] font-mono ${
                  chk.passed ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''
                }`}
              >
                {chk.name}: {chk.passed ? 'PASSED' : 'FAILED'}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Task Brief Sheet (Pattern 4) ─────────────────────────────────── */}
      <Sheet open={isTaskBriefOpen} onOpenChange={setIsTaskBriefOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <SheetTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {config.title || lab?.title || 'Automation Lab Task Brief'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            {(config.scenarioDescription || lab?.envelope?.instructions) && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Scenario &amp; Objectives
                </h4>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(config.scenarioDescription || lab?.envelope?.instructions || ''),
                  }}
                />
              </div>
            )}

            {config.publicChecks && config.publicChecks.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Verification Criteria
                </h4>
                <div className="space-y-2">
                  {config.publicChecks.map((chk, idx) => (
                    <div
                      key={chk.id || idx}
                      className="p-2.5 rounded-lg border border-border bg-card/60 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">{chk.name}</div>
                        {chk.description && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{chk.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
