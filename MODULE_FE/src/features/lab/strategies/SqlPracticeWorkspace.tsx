import { useState, useEffect, useRef } from 'react';
import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Database,
  Play,
  CloudUpload,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Rows,
} from 'lucide-react';
import { SqlSchemaPreview } from '../components/SqlSchemaPreview';
import { SqlWorkerAdapter } from '../sql-engine/SqlWorkerAdapter';
import type {
  SqlEngineAdapter,
  SqlExecutionResult,
  TableSchema,
} from '../sql-engine/types';
import { validateSqlQuery } from '../sql-engine/sqlGuard';
import { diffSqlResults, type SqlDiffResult } from '../sql-engine/sqlDiff';

export interface SqlPracticeWorkspaceProps extends WorkspaceStrategyProps {
  customAdapter?: SqlEngineAdapter;
}

interface SqlRunOutcome {
  execution: SqlExecutionResult;
  diff: SqlDiffResult | null;
}

export function SqlPracticeWorkspace({
  lab,
  code,
  onCodeChange,
  onSubmit,
  isSubmitting = false,
  onResetCode,
  customAdapter,
}: SqlPracticeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'result' | 'diff' | 'schema'>('result');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [execResult, setExecResult] = useState<SqlExecutionResult | null>(null);
  const [diffResult, setDiffResult] = useState<SqlDiffResult | null>(null);
  const [guardError, setGuardError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showFirstTimeNotice, setShowFirstTimeNotice] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !localStorage.getItem('study_sql_first_visit_dismissed');
    } catch {
      return false;
    }
  });

  const handleDismissFirstTimeNotice = () => {
    setShowFirstTimeNotice(false);
    try {
      localStorage.setItem('study_sql_first_visit_dismissed', 'true');
    } catch {}
  };

  const adapterRef = useRef<SqlEngineAdapter | null>(null);
  const submissionInFlightRef = useRef(false);

  // Extract config
  const config =
    lab.envelope && lab.envelope.sandboxType === 'sql_worker'
      ? lab.envelope.config
      : null;

  const schemaSql = config?.schemaSql || (lab as any).sqlSchema || '';
  const seedSql = config?.seedSql || '';
  const expectedRows =
    config?.expectedQueryResult ||
    (lab as any).expectedQueryResult ||
    [];

  // Initialize SQL Engine on mount or lab change
  useEffect(() => {
    let isCancelled = false;
    const adapter = customAdapter || new SqlWorkerAdapter();
    adapterRef.current = adapter;

    async function init() {
      setIsLoadingSchema(true);
      setExecResult(null);
      setDiffResult(null);
      setGuardError(null);
      setInitError(null);
      try {
        await adapter.initialize(schemaSql, seedSql);
        const schemaTables = await adapter.getSchemaOverview();
        if (!isCancelled) {
          setTables(schemaTables);
          setIsLoadingSchema(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setIsLoadingSchema(false);
          setInitError(err instanceof Error ? err.message : 'The SQL sandbox could not start.');
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
      adapter.dispose().catch(() => {});
    };
  }, [lab.id, schemaSql, seedSql, customAdapter, retryKey]);

  const handleResetDatabase = async () => {
    if (!adapterRef.current) return;
    setIsRunning(true);
    try {
      await adapterRef.current.reset(schemaSql, seedSql);
      const schemaTables = await adapterRef.current.getSchemaOverview();
      setTables(schemaTables);
      setExecResult(null);
      setDiffResult(null);
      setGuardError(null);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuery = async (): Promise<SqlRunOutcome | null> => {
    if (!adapterRef.current) return null;

    setGuardError(null);

    // 1. Guard check
    const guard = validateSqlQuery(code, config?.statementPolicy ?? 'read_only');
    if (!guard.allowed) {
      setGuardError(guard.error || 'Query rejected by security policy');
      setActiveTab('result');
      return null;
    }

    setIsRunning(true);
    try {
      // 2. Execute through engine adapter
      const res = await adapterRef.current.execute(guard.sanitizedQuery || code, {
        timeoutMs: config?.timeoutMs ?? 3000,
        maxRows: config?.maxResultRows ?? 500,
        maxColumns: config?.maxResultColumns ?? 50,
      });
      setExecResult(res);

      if (res.error) {
        setDiffResult(null);
        setActiveTab('result');
        return { execution: res, diff: null };
      }

      // 3. Diff actual vs expected
      if (expectedRows.length > 0) {
        const diff = diffSqlResults(res.rows, expectedRows, {
          orderSensitive: config?.orderSensitive,
          expectedColumns: config?.expectedColumns,
        });
        setDiffResult(diff);
        setActiveTab('diff');
        return { execution: res, diff };
      } else {
        setDiffResult(null);
        setActiveTab('result');
        return { execution: res, diff: null };
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunQuery = async () => {
    await runQuery();
  };

  const handleSubmit = async () => {
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    try {
      const outcome = await runQuery();
      if (!outcome) return;

      await onSubmit({
        submittedCode: code,
        // This is only a compatibility hint. SQL pass/fail is decided by the backend grader.
        status: outcome.diff?.isMatch ? 'passed' : 'failed',
        timeMs: outcome.execution.executionTimeMs || 1,
        testLogs:
          outcome.diff?.summary ||
          (outcome.execution.error ? `Error: ${outcome.execution.error}` : undefined),
      });
    } finally {
      submissionInFlightRef.current = false;
    }
  };

  const handleCodeChange = (nextCode: string) => {
    setExecResult(null);
    setDiffResult(null);
    setGuardError(null);
    onCodeChange(nextCode);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      {/* ── Top Toolbar ───────────────────────────────────────────────────── */}
      <div className="h-9 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            PostgreSQL Query Editor
          </span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {isLoadingSchema ? 'Starting PGlite…' : initError ? 'PGlite unavailable' : 'PGlite (in-browser)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'schema' ? 'result' : 'schema')}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <Rows className="size-3" />
            <span>Schema</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDatabase}
            disabled={isRunning || isLoadingSchema || Boolean(initError)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            title="Reset in-memory dataset to initial seed"
          >
            <RotateCcw className="size-3" />
            <span>Reset DB</span>
          </Button>

          {onResetCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetCode}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              title="Reset query to starter snippet"
            >
              <span>Reset SQL</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRunQuery}
            disabled={isRunning || isLoadingSchema || Boolean(initError)}
            className="h-7 text-xs gap-1.5 font-semibold"
          >
            <Play className="size-3 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Query'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || isRunning || isLoadingSchema || Boolean(initError)}
            className="h-7 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CloudUpload className="size-3" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Lab'}</span>
          </Button>
        </div>
      </div>

      {/* ── First-Time / Sandbox Initialization Banner (English) ──────────── */}
      {isLoadingSchema && (
        <div
          role="status"
          className="mx-3 mt-2 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-foreground flex items-start gap-3 shadow-xs animate-in fade-in duration-300 shrink-0"
        >
          <div className="relative flex items-center justify-center size-8 rounded-full bg-blue-500/20 text-blue-500 shrink-0 mt-0.5">
            <Database className="size-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-blue-500"></span>
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground">
                Setting up In-Browser PostgreSQL Database Sandbox
              </h4>
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                WebAssembly
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Please wait a moment while the local PostgreSQL engine compiles and your practice schema is seeded.
              On your first visit, downloading database assets (~16 MB) may take 5–15 seconds depending on your connection.
            </p>
          </div>
        </div>
      )}

      {showFirstTimeNotice && !isLoadingSchema && !initError && (
        <div className="mx-3 mt-2 p-2.5 rounded-md border border-border bg-card flex items-center justify-between text-xs text-foreground shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px]">
              <strong>Welcome to SQL Sandbox!</strong> Your queries execute locally in your browser using isolated PostgreSQL WebAssembly. No data is sent to external servers.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissFirstTimeNotice}
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
          >
            Got it
          </Button>
        </div>
      )}

      {/* ── Monaco Editor & Results Split (Resizable) ──────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ResizablePanelGroup
          direction="vertical"
          autoSaveId="study-web-sql-vertical-split"
          className="flex-1 min-h-0 w-full"
        >
          {/* Top Panel: Monaco Editor */}
          <ResizablePanel defaultSize="58%" minSize="25%" className="flex flex-col min-h-0">
            <div className="flex-1 min-h-0 relative h-full">
              <Editor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={code}
                onChange={(val) => handleCodeChange(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  tabSize: 2,
                  wordWrap: 'on',
                  suggestOnTriggerCharacters: true,
                }}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom Panel: Results, Diff & Schema */}
          <ResizablePanel defaultSize="42%" minSize="18%" className="flex flex-col min-h-0">
            <div className="h-full border-t-0 bg-card flex flex-col flex-1 overflow-hidden">
        {/* Panel Tabs Header */}
        <div className="h-8 border-b border-border bg-muted/40 flex items-center justify-between px-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'result'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Query Result
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'diff'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Result Diff
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'schema'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Schema ({tables.length})
            </button>
          </div>

          {/* Right summary info */}
          <div className="flex items-center gap-2 text-xs">
            {execResult && (
              <span className="flex items-center gap-1 text-muted-foreground text-[11px] font-mono">
                <Clock className="size-3" />
                {execResult.executionTimeMs}ms
              </span>
            )}
            {diffResult && (
              <Badge
                variant={diffResult.isMatch ? 'default' : 'destructive'}
                className="h-5 text-[10px] gap-1"
              >
                {diffResult.isMatch ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    <span>Matched ({diffResult.matchedRowCount}/{diffResult.expectedRowCount})</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-3" />
                    <span>Mismatch</span>
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Panel Content Body */}
        <div className="flex-1 overflow-auto p-3">
          {initError && (
            <div role="alert" className="mb-3 p-3 rounded border border-amber-500/50 bg-amber-500/10 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold">SQL sandbox did not initialize</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{initError}</p>
                  <p className="text-[11px] text-muted-foreground">Check WebAssembly support or your connection, then retry.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setRetryKey((value) => value + 1)}>
                Retry
              </Button>
            </div>
          )}

          {/* 1. Guard Security Alert */}
          {guardError && (
            <div className="mb-3 p-2.5 rounded border border-destructive/50 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Security Warning</p>
                <p className="text-[11px] opacity-90">{guardError}</p>
              </div>
            </div>
          )}

          {/* 2. SQL Runtime Error */}
          {execResult?.error && (
            <div className="mb-3 p-2.5 rounded border border-destructive/50 bg-destructive/10 text-destructive text-xs font-mono">
              <p className="font-semibold">PostgreSQL Error:</p>
              <p className="text-[11px]">{execResult.error}</p>
            </div>
          )}

          {/* 3. Result Tab */}
          {activeTab === 'result' && (
            <div>
              {execResult && !execResult.error && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                    <span>
                      Returned <strong className="text-foreground">{execResult.rowCount}</strong> rows
                    </span>
                  </div>
                  <div className="rounded border border-border overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground border-b border-border">
                          {execResult.columns.map((col) => (
                            <th key={col} className="py-1 px-2 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {execResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-muted/30">
                            {execResult.columns.map((col) => {
                              const val = row[col];
                              return (
                                <td key={col} className="py-1 px-2">
                                  {val === null || val === undefined ? (
                                    <span className="text-muted-foreground italic">null</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isLoadingSchema && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Database className="size-8 mb-3 text-primary animate-pulse opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Setting up Database Sandbox…</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mt-1">
                    Compiling in-browser PostgreSQL WebAssembly and preparing practice tables.
                  </p>
                </div>
              )}

              {!isLoadingSchema && !execResult && !guardError && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Play className="size-6 mb-2 opacity-30" />
                  <p className="text-xs font-medium">Run your query to preview output</p>
                  <p className="text-[11px] opacity-70">
                    Results and execution time will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. Diff Tab */}
          {activeTab === 'diff' && (
            <div>
              {diffResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-2.5 rounded text-xs border ${
                      diffResult.isMatch
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/40 bg-destructive/10 text-destructive'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {diffResult.isMatch ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <span>Output matches target requirements perfectly!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-4" />
                          <span>Output does not match expected result</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] mt-1 opacity-90">{diffResult.summary}</p>
                  </div>

                  {/* Visual diff list */}
                  <div className="rounded border border-border overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground border-b border-border">
                          <th className="py-1 px-2 font-medium">Status</th>
                          {diffResult.expectedColumns.map((col) => (
                            <th key={col} className="py-1 px-2 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {diffResult.rowDiffs.map((diff, idx) => {
                          const row = diff.actualRow || diff.expectedRow || {};
                          const isMatched = diff.status === 'matched';
                          const isMissing = diff.status === 'missing';
                          const isUnexpected = diff.status === 'unexpected';

                          return (
                            <tr
                              key={idx}
                              className={
                                isMatched
                                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                  : isMissing
                                  ? 'bg-amber-500/10 hover:bg-amber-500/15'
                                  : 'bg-destructive/10 hover:bg-destructive/15'
                              }
                            >
                              <td className="py-1 px-2">
                                {isMatched && (
                                  <span className="text-[10px] text-emerald-500 font-semibold">
                                    MATCH
                                  </span>
                                )}
                                {isMissing && (
                                  <span className="text-[10px] text-amber-500 font-semibold">
                                    MISSING
                                  </span>
                                )}
                                {isUnexpected && (
                                  <span className="text-[10px] text-destructive font-semibold">
                                    UNEXPECTED
                                  </span>
                                )}
                              </td>
                              {diffResult.expectedColumns.map((col) => {
                                const val = row[col];
                                const hasCellDiff = diff.cellDiffs && col in diff.cellDiffs;

                                return (
                                  <td
                                    key={col}
                                    className={`py-1 px-2 ${
                                      hasCellDiff ? 'underline font-bold text-destructive' : ''
                                    }`}
                                  >
                                    {val === null || val === undefined ? (
                                      <span className="text-muted-foreground italic">null</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Sparkles className="size-6 mb-2 opacity-30" />
                  <p className="text-xs font-medium">
                    {expectedRows.length > 0
                      ? 'Run a query to compare with expected result'
                      : 'Expected results are checked securely when you submit'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Schema Tab */}
          {activeTab === 'schema' && (
            <SqlSchemaPreview tables={tables} isLoading={isLoadingSchema} />
          )}
        </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
