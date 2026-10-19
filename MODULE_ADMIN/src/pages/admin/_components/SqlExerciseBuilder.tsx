import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Database,
  Play,
  FileCode2,
  Zap,
  Table as TableIcon,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { labApi } from '@/features/lab/api/lab.api';
import type { SqlLabConfig } from '@/types/lab.types';

export interface SqlColumn {
  name: string;
  type: string;
}

export interface SqlExpectedRow {
  [colName: string]: string | number;
}

interface SqlExerciseBuilderProps {
  sqlSchema: string;
  onSqlSchemaChange: (val: string) => void;
  initialSnippet: string;
  onInitialSnippetChange: (val: string) => void;
  solution: string;
  onSolutionChange: (val: string) => void;
  sampleData?: any[];
  onSampleDataChange?: (val: any[]) => void;
  onValidationChange?: (isValid: boolean, hasRunPassed: boolean) => void;
  sqlConfig?: Partial<SqlLabConfig>;
  onSqlConfigChange?: (config: Partial<SqlLabConfig>) => void;
}

export function SqlExerciseBuilder({
  sqlSchema,
  onSqlSchemaChange,
  initialSnippet,
  onInitialSnippetChange,
  solution,
  onSolutionChange,
  sampleData,
  onSampleDataChange,
  onValidationChange,
  sqlConfig = {},
  onSqlConfigChange,
}: SqlExerciseBuilderProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'starter' | 'solution' | 'testcases'>('schema');
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [testResult, setTestResult] = useState<{ passed: boolean; message: string; rows?: any[] } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Parse tables and mock rows from DDL/DML sqlSchema
  const parsedSchema = useMemo(() => {
    if (!sqlSchema) return { tableName: 'data', columns: [], rows: [] };

    // Extract table name
    const tableMatch = sqlSchema.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+?)\);/i);
    const tableName = tableMatch ? tableMatch[1] : 'sample_table';
    
    // Extract columns
    const columns: SqlColumn[] = [];
    if (tableMatch) {
      const colDefs = tableMatch[2].split(',');
      colDefs.forEach((colDef) => {
        const trimmed = colDef.trim();
        if (trimmed && !trimmed.toUpperCase().startsWith('PRIMARY') && !trimmed.toUpperCase().startsWith('CONSTRAINT')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            columns.push({ name: parts[0], type: parts[1].toUpperCase() });
          }
        }
      });
    }

    // Extract values
    const insertMatches = sqlSchema.matchAll(/INSERT\s+INTO\s+[a-zA-Z0-9_]+\s*(?:\([^)]+\))?\s*VALUES\s*([\s\S]+?);/gi);
    const rows: Record<string, any>[] = [];

    for (const match of insertMatches) {
      const valuesBlock = match[1];
      // match (val1, val2, ...)
      const rowMatches = valuesBlock.matchAll(/\(([^)]+)\)/g);
      for (const rowMatch of rowMatches) {
        const rawVals = rowMatch[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, ''));
        const rowObj: Record<string, any> = {};
        columns.forEach((col, i) => {
          rowObj[col.name] = rawVals[i] !== undefined ? rawVals[i] : '';
        });
        rows.push(rowObj);
      }
    }

    return { tableName, columns, rows };
  }, [sqlSchema]);

  // Expected grid state (used for test case verification)
  const [expectedColumns, setExpectedColumns] = useState<string[]>(() => {
    if (sampleData && sampleData.length > 0) {
      return Object.keys(sampleData[0]);
    }
    return ['id', 'full_name', 'total_spent'];
  });

  const [expectedRows, setExpectedRows] = useState<Record<string, any>[]>(() => {
    if (sampleData && sampleData.length > 0) {
      return sampleData;
    }
    return [];
  });

  // Sync sampleData to parent
  useEffect(() => {
    if (onSampleDataChange && expectedRows.length > 0) {
      onSampleDataChange(expectedRows);
    }
  }, [expectedRows, onSampleDataChange]);

  const isValid = useMemo(() => {
    return (
      sqlSchema.trim().length > 20 &&
      solution.trim().length > 10 &&
      (sqlConfig.statementPolicy !== 'mutable' || Boolean(sqlConfig.verificationSql?.trim()))
    );
  }, [sqlSchema, solution, sqlConfig.statementPolicy, sqlConfig.verificationSql]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid, !!testResult?.passed);
    }
  }, [isValid, testResult, onValidationChange]);

  useEffect(() => {
    setTestResult(null);
  }, [sqlSchema, solution]);

  const runReferenceSolution = async () => {
    if (!solution.trim()) {
      throw new Error('Please enter a reference solution query first.');
    }
    if (!sqlSchema.trim()) {
      throw new Error('Please enter schema and seed SQL first.');
    }
    return labApi.preflightSql({
      schemaSql: sqlSchema,
      solution,
      statementPolicy: sqlConfig.statementPolicy || 'read_only',
      verificationSql: sqlConfig.verificationSql,
      timeoutMs: sqlConfig.timeoutMs || 3000,
    });
  };

  // Generate expected output using the same isolated PostgreSQL engine used by grading.
  const handleGenerateFromSolution = async () => {
    setIsTesting(true);
    try {
      const result = await runReferenceSolution();
      const rows = result.rows || [];
      const columns = result.columns || (rows[0] ? Object.keys(rows[0]) : []);
      setExpectedColumns(columns);
      setExpectedRows(rows);
      setTestResult({
        passed: result.status === 'passed',
        message: result.status === 'passed'
          ? `Generated ${rows.length} expected row(s) with PGlite in ${result.timeMs}ms.`
          : result.testLogs,
        rows,
      });
    } catch (error) {
      setTestResult({
        passed: false,
        message: error instanceof Error ? error.message : 'PGlite preflight failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Test Solution against Test Cases
  const handleTestSolution = async () => {
    setIsTesting(true);
    try {
      const result = await runReferenceSolution();
      const rows = result.rows || [];
      const columns = result.columns || (rows[0] ? Object.keys(rows[0]) : []);
      if (result.status === 'passed') {
        setExpectedColumns(columns);
        setExpectedRows(rows);
      }
      setTestResult({
        passed: result.status === 'passed',
        message: result.testLogs,
        rows,
      });
    } catch (error) {
      setTestResult({
        passed: false,
        message: error instanceof Error ? error.message : 'PGlite preflight failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyPreset = () => {
    onSqlSchemaChange(`CREATE TABLE customers (
  id INT PRIMARY KEY,
  full_name VARCHAR(100),
  total_spent DECIMAL(12, 2),
  city VARCHAR(50)
);

INSERT INTO customers VALUES 
(1, 'Alice Johnson', 1500.00, 'New York'),
(2, 'Bob Smith', 800.00, 'Chicago'),
(3, 'Charlie Brown', 2200.00, 'San Francisco'),
(4, 'Diana Prince', 3100.00, 'Seattle');`);

    onInitialSnippetChange(`-- Write query to select customers with total_spent > 1000
SELECT id, full_name, total_spent
FROM customers
WHERE ...
ORDER BY total_spent DESC;`);

    onSolutionChange(`SELECT id, full_name, total_spent
FROM customers
WHERE total_spent > 1000
ORDER BY total_spent DESC;`);

    setExpectedColumns(['id', 'full_name', 'total_spent']);
    setExpectedRows([
      { id: 4, full_name: 'Diana Prince', total_spent: '3100.00' },
      { id: 3, full_name: 'Charlie Brown', total_spent: '2200.00' },
      { id: 1, full_name: 'Alice Johnson', total_spent: '1500.00' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">SQL Database Challenge Configuration</h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              PostgreSQL Sandbox
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure DDL/DML schema, starter query for learners, and expected test grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPreset}
            className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <FileCode2 className="size-3.5 text-primary" />
            <span>Standard SQL Template</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleTestSolution}
            disabled={isTesting}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Play className="size-3.5 fill-current" />
            <span>{isTesting ? 'Running PGlite…' : '▶ Test Run Solution'}</span>
          </Button>
        </div>
      </div>

      {/* ── Run Result Alert ────────────────────────────────────────── */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            testResult.passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {testResult.passed ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {testResult.passed ? 'Solution Test PASSED ✓' : 'Query Test FAILED ✗'}
              </span>
              <p className="text-xs opacity-90 mt-0.5">{testResult.message}</p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={
              testResult.passed
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold'
            }
          >
            {testResult.passed ? 'MATCH 100%' : 'QUERY ERROR'}
          </Badge>
        </div>
      )}

      {/* ── 4 Main Sections Tabs ────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-10 p-1 bg-muted/40 border border-border rounded-xl">
          <TabsTrigger value="schema" className="text-xs font-semibold gap-1.5">
            <Database className="size-3.5" />
            <span>1. Schema &amp; Data</span>
          </TabsTrigger>
          <TabsTrigger value="starter" className="text-xs font-semibold gap-1.5">
            <Layers className="size-3.5" />
            <span>2. Starter Query</span>
          </TabsTrigger>
          <TabsTrigger value="solution" className="text-xs font-semibold gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>3. Reference Solution</span>
          </TabsTrigger>
          <TabsTrigger value="testcases" className="text-xs font-semibold gap-1.5">
            <TableIcon className="size-3.5 text-primary" />
            <span>4. Test Cases Grid</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: SCHEMA & DATA ──────────────────────────────────── */}
        <TabsContent value="schema" className="mt-4 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Database Schema &amp; Seed Data (CREATE TABLE &amp; INSERT INTO) *
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Define table structure and initial sample seed rows for practice.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                className="h-7 text-xs font-medium gap-1"
              >
                <Eye className="size-3.5" />
                <span>{showSchemaPreview ? 'Hide Data Grid' : 'Preview Data Grid'}</span>
              </Button>
            </div>

            <textarea
              rows={9}
              required
              value={sqlSchema}
              onChange={(e) => onSqlSchemaChange(e.target.value)}
              placeholder="CREATE TABLE customers (id INT, full_name VARCHAR, total_spent DECIMAL);&#10;INSERT INTO customers VALUES (1, 'Alice Smith', 1500.00);"
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold">
                Statement policy
                <select
                  value={sqlConfig.statementPolicy || 'read_only'}
                  onChange={(event) => onSqlConfigChange?.({ ...sqlConfig, statementPolicy: event.target.value as 'read_only' | 'mutable' })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
                >
                  <option value="read_only">Read-only query</option>
                  <option value="mutable">Data/schema mutation</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Timeout (ms)
                <input
                  type="number"
                  min={500}
                  max={10000}
                  value={sqlConfig.timeoutMs || 3000}
                  onChange={(event) => onSqlConfigChange?.({ ...sqlConfig, timeoutMs: Number(event.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(sqlConfig.orderSensitive)}
                  onChange={(event) => onSqlConfigChange?.({ ...sqlConfig, orderSensitive: event.target.checked })}
                />
                Result order must match
              </label>
            </div>

            {sqlConfig.statementPolicy === 'mutable' && (
              <label className="block space-y-1 text-xs font-semibold">
                Hidden verification query *
                <textarea
                  rows={3}
                  value={sqlConfig.verificationSql || ''}
                  onChange={(event) => onSqlConfigChange?.({ ...sqlConfig, verificationSql: event.target.value })}
                  placeholder="SELECT id, active FROM users ORDER BY id;"
                  className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs font-normal"
                />
                <span className="block text-[11px] font-normal text-muted-foreground">
                  Runs after the learner mutation and is never sent to learners.
                </span>
              </label>
            )}

            {/* Grid preview of seeded table */}
            {showSchemaPreview && (
              <div className="mt-3 p-4 rounded-xl border border-border/80 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Table: <code className="text-primary font-mono">{parsedSchema.tableName}</code> ({parsedSchema.rows.length} rows)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {parsedSchema.columns.length} COLUMNS
                  </Badge>
                </div>

                {parsedSchema.columns.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          {parsedSchema.columns.map((c) => (
                            <th key={c.name} className="px-3 py-2 font-mono font-semibold text-muted-foreground">
                              {c.name} <span className="text-[9px] opacity-60">({c.type})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {parsedSchema.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            {parsedSchema.columns.map((c) => (
                              <td key={c.name} className="px-3 py-2 text-foreground/90">
                                {String(row[c.name] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Could not parse table schema. Ensure DDL includes CREATE TABLE and INSERT INTO statements.
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: STARTER QUERY ──────────────────────────────────── */}
        <TabsContent value="starter" className="mt-4 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="pb-2 border-b border-border/70">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Starter Query
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pre-populated in learner's query editor when starting this lab.
              </p>
            </div>

            <textarea
              rows={8}
              value={initialSnippet}
              onChange={(e) => onInitialSnippetChange(e.target.value)}
              placeholder="-- Write query according to requirements...&#10;SELECT id, full_name FROM customers WHERE ...;"
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        </TabsContent>

        {/* ── TAB 3: REFERENCE SOLUTION ─────────────────────────────── */}
        <TabsContent value="solution" className="mt-4 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Reference Model Solution *
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Standard SQL query used to validate correctness and generate expected rows.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleGenerateFromSolution}
                disabled={isTesting}
                className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Zap className="size-3.5" />
                <span>⚡ Generate Test Cases from Solution</span>
              </Button>
            </div>

            <textarea
              rows={8}
              required
              value={solution}
              onChange={(e) => onSolutionChange(e.target.value)}
              placeholder="SELECT id, full_name, total_spent FROM customers WHERE total_spent > 1000 ORDER BY total_spent DESC;"
              className="w-full font-mono text-xs bg-background border border-border rounded-xl p-3.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        </TabsContent>

        {/* ── TAB 4: TEST CASES GRID ────────────────────────────────── */}
        <TabsContent value="testcases" className="mt-4 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Expected Result Grid
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {expectedRows.length} ROWS
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Learners must write a query returning the exact columns and rows below.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFromSolution}
                  disabled={isTesting}
                  className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30"
                >
                  <Zap className="size-3" />
                  <span>⚡ Auto-generate from Solution</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const emptyRow: Record<string, any> = {};
                    expectedColumns.forEach((c) => (emptyRow[c] = ''));
                    setExpectedRows([...expectedRows, emptyRow]);
                  }}
                  className="h-7 text-xs font-semibold gap-1"
                >
                  <Plus className="size-3" />
                  <span>Add Row</span>
                </Button>
              </div>
            </div>

            {/* Editable Columns row */}
            <div className="flex items-center gap-2 pb-1 overflow-x-auto">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Columns:</span>
              {expectedColumns.map((col, idx) => (
                <div key={idx} className="flex items-center bg-muted/40 border border-border rounded-lg px-2 py-1 gap-1 text-xs font-mono">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => {
                      const next = [...expectedColumns];
                      next[idx] = e.target.value;
                      setExpectedColumns(next);
                    }}
                    className="bg-transparent border-0 font-bold text-foreground focus:outline-none w-24 text-xs"
                  />
                  {expectedColumns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpectedColumns(expectedColumns.filter((_, i) => i !== idx));
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const colName = `col_${expectedColumns.length + 1}`;
                  setExpectedColumns([...expectedColumns, colName]);
                }}
                className="h-6 text-[11px] px-2 text-primary"
              >
                + Column
              </Button>
            </div>

            {/* Grid Table of Expected Rows */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="px-3 py-2 font-mono text-muted-foreground w-10 text-center">#</th>
                    {expectedColumns.map((col) => (
                      <th key={col} className="px-3 py-2 font-mono font-bold text-foreground">
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right w-16">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {expectedRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-center text-muted-foreground font-semibold">{rIdx + 1}</td>
                      {expectedColumns.map((col) => (
                        <td key={col} className="px-2 py-1.5">
                          <input
                            type="text"
                            value={row[col] !== undefined ? String(row[col]) : ''}
                            onChange={(e) => {
                              const next = [...expectedRows];
                              next[rIdx] = { ...next[rIdx], [col]: e.target.value };
                              setExpectedRows(next);
                            }}
                            className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (expectedRows.length <= 1) {
                              alert('At least 1 expected row is required.');
                              return;
                            }
                            setExpectedRows(expectedRows.filter((_, i) => i !== rIdx));
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
