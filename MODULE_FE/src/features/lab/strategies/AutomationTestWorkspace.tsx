import { useState, useEffect, useMemo } from 'react';
import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import Editor from '@monaco-editor/react';
import { useLabWorker } from '@/features/lab/hooks/useLabWorker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Play,
  CloudUpload,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { TestingCheatSheet } from '../components/TestingCheatSheet';
import { SmartClozeEditor } from '../components/SmartClozeEditor';
import {
  assembleClozeCode,
  validateBlankAnswers,
  getDefaultAnswers,
} from '../runtime/cloze/clozeEngine';
import type { AutomationExerciseV2 } from '@/types/lab.types';

export function AutomationTestWorkspace({
  lab,
  code,
  onCodeChange,
  onSubmit,
  isSubmitting = false,
  onResetCode,
}: WorkspaceStrategyProps) {
  const [bottomTab, setBottomTab] = useState<'results' | 'cheatsheet' | 'logs'>('results');
  const { status: workerStatus, result, run: runWorker, reset: resetWorker } = useLabWorker();

  const envelope = lab?.envelope;
  const config = envelope?.config as (AutomationExerciseV2 | undefined);
  const isSmartCloze = Boolean(
    config?.version === '2.0' && config?.interactionMode === 'smart_cloze' && Array.isArray(config?.blanks),
  );
  const smartClozeConfig = isSmartCloze ? (config as AutomationExerciseV2) : null;

  // Cloze state
  const [answers, setAnswers] = useState<Record<string, any>>(() =>
    smartClozeConfig ? getDefaultAnswers(smartClozeConfig.blanks) : {},
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);
  const [hasRunSinceEdit, setHasRunSinceEdit] = useState(false);

  // Sync answers if lab changes
  useEffect(() => {
    if (smartClozeConfig) {
      const defaults = getDefaultAnswers(smartClozeConfig.blanks);
      setAnswers(defaults);
      setValidationErrors({});
      setHasRunSinceEdit(false);
      resetWorker();
      const initialAssembled = assembleClozeCode(
        smartClozeConfig.publicTemplate,
        smartClozeConfig.blanks,
        defaults,
      );
      onCodeChange(initialAssembled);
    }
  }, [lab?.id, lab?.slug]);

  const handleAnswerChange = (blankId: string, val: any) => {
    if (!smartClozeConfig) return;
    const nextAnswers = { ...answers, [blankId]: val };
    setAnswers(nextAnswers);
    setHasRunSinceEdit(false);

    if (validationErrors[blankId]) {
      const nextErrors = { ...validationErrors };
      delete nextErrors[blankId];
      setValidationErrors(nextErrors);
    }

    const assembled = assembleClozeCode(
      smartClozeConfig.publicTemplate,
      smartClozeConfig.blanks,
      nextAnswers,
    );
    onCodeChange(assembled);
  };

  const handleMonacoCodeChange = (newCode: string) => {
    setHasRunSinceEdit(false);
    onCodeChange(newCode);
  };

  const handleResetSingleBlank = (blankId: string) => {
    if (!smartClozeConfig) return;
    const blank = smartClozeConfig.blanks.find((b) => b.id === blankId);
    if (!blank) return;
    const defaultVal =
      blank.defaultValue !== undefined
        ? blank.defaultValue
        : blank.options && blank.options.length > 0
          ? blank.options[0].value
          : '';
    handleAnswerChange(blankId, defaultVal);
  };

  const handleReset = () => {
    if (isSmartCloze && smartClozeConfig) {
      const defaults = getDefaultAnswers(smartClozeConfig.blanks);
      setAnswers(defaults);
      setValidationErrors({});
      setHasRunSinceEdit(false);
      resetWorker();
      const assembled = assembleClozeCode(
        smartClozeConfig.publicTemplate,
        smartClozeConfig.blanks,
        defaults,
      );
      onCodeChange(assembled);
    } else if (onResetCode) {
      setHasRunSinceEdit(false);
      resetWorker();
      onResetCode();
    }
  };

  const handleRunTests = () => {
    resetWorker();
    setBottomTab('results');

    if (isSmartCloze && smartClozeConfig) {
      const { isValid, errors } = validateBlankAnswers(smartClozeConfig.blanks, answers);
      if (!isValid) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors({});
      setHasRunSinceEdit(true);
      const testScript = envelope ? envelope.testScript : (lab as any).testScript;
      const executableCode = assembleClozeCode(
        smartClozeConfig.publicTemplate,
        smartClozeConfig.blanks,
        answers,
      );
      runWorker(executableCode, testScript || '');
    } else {
      setHasRunSinceEdit(true);
      const testScript = envelope ? envelope.testScript : (lab as any).testScript;
      runWorker(code, testScript || '');
    }
  };

  const handleSubmit = async () => {
    if (isSmartCloze && smartClozeConfig) {
      const { isValid, errors } = validateBlankAnswers(smartClozeConfig.blanks, answers);
      if (!isValid) {
        setValidationErrors(errors);
        setBottomTab('results');
        return;
      }
    }

    const isCurrentRunPassed = Boolean(result?.passed && hasRunSinceEdit);
    const codeToSubmit =
      isSmartCloze && smartClozeConfig
        ? assembleClozeCode(smartClozeConfig.publicTemplate, smartClozeConfig.blanks, answers)
        : code;

    await onSubmit({
      submittedCode: codeToSubmit,
      status: isCurrentRunPassed ? 'passed' : 'failed',
      timeMs: result?.timeMs || 50,
      testLogs: result?.logs?.join('\n'),
      answers: isSmartCloze ? answers : undefined,
    });
  };

  const isRunning = workerStatus === 'running';
  const testCases = result?.testCases || [];
  const passedCount = testCases.filter((t) => t.passed).length;
  const failedCount = testCases.length - passedCount;

  const completedBlanksCount = useMemo(() => {
    if (!smartClozeConfig) return 0;
    return smartClozeConfig.blanks.filter((b) => {
      const val = answers[b.id];
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;
  }, [smartClozeConfig, answers]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      {/* ── Top Toolbar ───────────────────────────────────────────────────── */}
      <div className="h-9 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          {isSmartCloze ? (
            <Lock className="size-3.5 text-amber-500" />
          ) : (
            <Terminal className="size-3.5 text-primary" />
          )}
          <span className="text-xs font-semibold text-foreground">
            {isSmartCloze ? 'Smart Cloze Automation Test' : 'API Automation Test Script (JavaScript)'}
          </span>
          {isSmartCloze && smartClozeConfig && (
            <Badge
              variant="secondary"
              className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"
            >
              {completedBlanksCount}/{smartClozeConfig.blanks.length} blanks filled
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBottomTab(bottomTab === 'cheatsheet' ? 'results' : 'cheatsheet')}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <HelpCircle className="size-3" />
            <span>CheatSheet</span>
          </Button>

          {(onResetCode || isSmartCloze) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              title={isSmartCloze ? 'Reset blanks to defaults' : 'Reset code to starter snippet'}
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRunTests}
            disabled={isRunning}
            className="h-7 text-xs gap-1.5 font-semibold"
          >
            <Play className="size-3 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="h-7 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CloudUpload className="size-3" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </Button>
        </div>
      </div>

      {/* ── Screen Reader Live Region for Accessibility ───────────────────── */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {Object.keys(validationErrors).length > 0
          ? `Validation errors in ${Object.keys(validationErrors).length} blank(s). Please fix before testing.`
          : isRunning
            ? 'Running automated tests in Web Worker sandbox.'
            : result
              ? result.passed
                ? `All ${testCases.length} test assertions passed successfully.`
                : `${failedCount} of ${testCases.length} test assertions failed.`
              : ''}
      </div>

      {/* ── Editor & Bottom Panel Split (Resizable) ────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ResizablePanelGroup
          direction="vertical"
          autoSaveId="study-web-automation-vertical-split"
          className="flex-1 min-h-0 w-full"
        >
          {/* Top Panel: Editor */}
          <ResizablePanel defaultSize="58%" minSize="25%" className="flex flex-col min-h-0">
            <div className="flex-1 min-h-0 relative flex flex-col h-full overflow-auto">
              {isSmartCloze && smartClozeConfig ? (
                <SmartClozeEditor
                  template={smartClozeConfig.publicTemplate}
                  blanks={smartClozeConfig.blanks}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                  validationErrors={validationErrors}
                  activeBlankId={activeBlankId}
                  onSelectBlank={setActiveBlankId}
                  onResetBlank={handleResetSingleBlank}
                  disabled={isRunning}
                />
              ) : (
                <Editor
                  height="100%"
                  language="javascript"
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => handleMonacoCodeChange(val || '')}
                  options={{
                    fontSize: 13,
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom Panel: Guided Verification Panel */}
          <ResizablePanel defaultSize="42%" minSize="18%" className="flex flex-col min-h-0">
            <div className="h-full border-t-0 flex flex-col bg-card flex-1 overflow-hidden">
        <Tabs
          value={bottomTab}
          onValueChange={(v) => setBottomTab(v as 'results' | 'cheatsheet' | 'logs')}
          className="flex flex-col h-full"
        >
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/20 p-0 h-8 gap-1 px-2">
            <TabsTrigger value="results" className="text-xs h-7 px-3 gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Test Results
              {testCases.length > 0 && (
                <span className="text-[10px] font-mono ml-1 px-1.5 py-0.2 rounded-full bg-muted font-bold">
                  {passedCount}/{testCases.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cheatsheet" className="text-xs h-7 px-3 gap-1.5">
              <Sparkles className="size-3 text-primary" />
              Testing CheatSheet
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs h-7 px-3 gap-1.5">
              <Terminal className="size-3" />
              Console Logs ({result?.logs?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Test Step Cards */}
          <TabsContent value="results" className="flex-1 overflow-y-auto p-3 m-0 space-y-2 text-xs">
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="size-3.5" />
                  Please complete and resolve blank errors before testing:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-300 font-mono">
                  {Object.entries(validationErrors).map(([id, err]) => (
                    <li key={id}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {!hasRunSinceEdit && result && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5 font-mono">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>Code or answers modified since last run. Click "Run Tests" to re-verify.</span>
              </div>
            )}

            {isRunning ? (
              <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                <span className="animate-spin">⏳</span>
                <span>Executing test runner in Web Worker sandbox...</span>
              </div>
            ) : !result ? (
              <div className="text-center py-8 text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No test results yet</p>
                <p className="text-[11px]">Click "Run Tests" to evaluate your assertions against test cases.</p>
              </div>
            ) : result.error ? (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <XCircle className="size-3.5" />
                  Runtime / Syntax Error
                </p>
                <pre className="font-mono text-[11px] whitespace-pre-wrap">{result.error}</pre>
              </div>
            ) : testCases.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No assertion steps executed. Check your test assertions.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={result.passed ? 'outline' : 'secondary'}
                      className={`text-[10px] font-bold ${
                        result.passed
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : 'border-rose-500/30 text-rose-600 bg-rose-500/10'
                      }`}
                    >
                      {result.passed ? 'ALL ASSERTIONS PASSED' : `${failedCount} ASSERTION(S) FAILED`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{result.timeMs}ms</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        tc.passed
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-rose-500/30 bg-rose-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {tc.passed ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="size-3.5 text-rose-500 shrink-0" />
                          )}
                          <span
                            className={`font-semibold truncate ${
                              tc.passed ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {tc.name}
                          </span>
                        </div>
                        {tc.executionTimeMs !== undefined && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {tc.executionTimeMs}ms
                          </span>
                        )}
                      </div>

                      {!tc.passed && tc.message && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-500/10 space-y-1 text-[11px]">
                          <p className="font-mono text-rose-600 dark:text-rose-400">{tc.message}</p>
                          {tc.expected !== undefined && tc.actual !== undefined && (
                            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                              <span>Expected: <strong className="text-foreground">{tc.expected}</strong></span>
                              <span>Received: <strong className="text-destructive">{tc.actual}</strong></span>
                            </div>
                          )}
                          {tc.hint && (
                            <p className="italic text-muted-foreground bg-muted/30 p-1.5 rounded">
                              💡 {tc.hint}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* CheatSheet Tab */}
          <TabsContent value="cheatsheet" className="flex-1 overflow-y-auto p-3 m-0">
            <TestingCheatSheet collapsible={false} />
          </TabsContent>

          {/* Console Logs Tab */}
          <TabsContent value="logs" className="flex-1 overflow-y-auto p-3 m-0 font-mono text-[11px]">
            {result?.logs && result.logs.length > 0 ? (
              <div className="space-y-1">
                {result.logs.map((line, i) => (
                  <div key={i} className="text-foreground/90 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No console logs recorded.</p>
            )}
          </TabsContent>
        </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
