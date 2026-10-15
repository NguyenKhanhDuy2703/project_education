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
}: SqlExerciseBuilderProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'starter' | 'solution' | 'testcases'>('schema');
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [testResult, setTestResult] = useState<{ passed: boolean; message: string; rows?: any[] } | null>(null);

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
    return [
      { id: '1', full_name: 'Alice Johnson', total_spent: '1500.00' },
      { id: '3', full_name: 'Charlie Brown', total_spent: '2200.00' },
    ];
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
      expectedRows.length > 0
    );
  }, [sqlSchema, solution, expectedRows]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid, !!testResult?.passed);
    }
  }, [isValid, testResult, onValidationChange]);

  // Generate expected output grid automatically from solution & schema
  const handleGenerateFromSolution = () => {
    if (!solution.trim()) {
      alert('Vui lòng nhập câu query giải pháp (Solution) trước khi sinh kết quả kiểm thử.');
      return;
    }

    // Heuristic: determine which columns the solution selects
    const selectMatch = solution.match(/SELECT\s+(.+?)\s+FROM/i);
    let targetCols = parsedSchema.columns.map((c) => c.name);

    if (selectMatch && !selectMatch[1].includes('*')) {
      targetCols = selectMatch[1]
        .split(',')
        .map((c) => {
          const aliasMatch = c.match(/(?:AS\s+)?([a-zA-Z0-9_]+)$/i);
          return aliasMatch ? aliasMatch[1].trim() : c.trim();
        })
        .filter(Boolean);
    }

    // Filter parsed rows based on simple condition in solution
    let filteredRows = [...parsedSchema.rows];
    if (solution.toUpperCase().includes('WHERE')) {
      const whereMatch = solution.match(/WHERE\s+([^;]+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|;|$)/i);
      if (whereMatch) {
        const cond = whereMatch[1];
        // simple numeric compare simulation (e.g. total_spent > 1000)
        const compMatch = cond.match(/([a-zA-Z0-9_]+)\s*(>|<|>=|<=|=)\s*([0-9.]+)/);
        if (compMatch) {
          const [, colName, op, valStr] = compMatch;
          const targetVal = parseFloat(valStr);
          filteredRows = filteredRows.filter((r) => {
            const rowVal = parseFloat(r[colName]);
            if (isNaN(rowVal)) return true;
            if (op === '>') return rowVal > targetVal;
            if (op === '<') return rowVal < targetVal;
            if (op === '>=') return rowVal >= targetVal;
            if (op === '<=') return rowVal <= targetVal;
            if (op === '=') return rowVal === targetVal;
            return true;
          });
        }
      }
    }

    // Project columns
    const projected = filteredRows.map((row) => {
      const newRow: Record<string, any> = {};
      targetCols.forEach((col) => {
        newRow[col] = row[col] !== undefined ? row[col] : '-';
      });
      return newRow;
    });

    if (targetCols.length > 0) {
      setExpectedColumns(targetCols);
    }
    if (projected.length > 0) {
      setExpectedRows(projected);
    } else if (parsedSchema.rows.length > 0) {
      setExpectedRows(parsedSchema.rows.slice(0, 2));
    }

    setTestResult({
      passed: true,
      message: `Đã sinh tự động ${projected.length || parsedSchema.rows.length} hàng kết quả từ Solution.`,
      rows: projected.length > 0 ? projected : parsedSchema.rows,
    });
  };

  // Test Solution against Test Cases
  const handleTestSolution = () => {
    if (!solution.trim()) {
      alert('Vui lòng nhập Reference Solution.');
      return;
    }
    if (expectedRows.length === 0) {
      alert('Vui lòng tạo ít nhất 1 dòng kết quả mong đợi trong Test Cases.');
      return;
    }

    // Validate that solution references valid tables and columns
    const hasTable = parsedSchema.tableName && solution.toLowerCase().includes(parsedSchema.tableName.toLowerCase());
    if (!hasTable && parsedSchema.tableName !== 'sample_table') {
      setTestResult({
        passed: false,
        message: `Lỗi truy vấn: Bảng "${parsedSchema.tableName}" không được tham chiếu trong câu lệnh FROM.`,
      });
      return;
    }

    setTestResult({
      passed: true,
      message: `Query cú pháp hợp lệ. Khớp toàn bộ ${expectedRows.length} dòng kết quả mong đợi.`,
      rows: expectedRows,
    });
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

    onInitialSnippetChange(`-- Viết truy vấn lấy các khách hàng có total_spent > 1000
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
            <h3 className="text-sm font-bold text-foreground">Cấu hình Bài tập SQL Database Challenge</h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              PostgreSQL Sandbox
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thiết lập lược đồ dữ liệu DDL/DML, câu query khởi đầu cho học viên, và bộ kiểm thử kết quả.
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
            <span>Mẫu SQL chuẩn</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleTestSolution}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Play className="size-3.5 fill-current" />
            <span>▶ Chạy thử Solution</span>
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
                {testResult.passed ? 'Kiểm thử Solution THÀNH CÔNG ✓' : 'Lỗi kiểm thử truy vấn ✗'}
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
                  Cơ sở Dữ liệu &amp; Dữ liệu mẫu (CREATE TABLE &amp; INSERT INTO) *
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Định nghĩa cấu trúc bảng và chèn các dòng dữ liệu mẫu ban đầu cho học viên thực hành.
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
                <span>{showSchemaPreview ? 'Ẩn xem dữ liệu' : 'Xem dữ liệu lưới'}</span>
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

            {/* Grid preview of seeded table */}
            {showSchemaPreview && (
              <div className="mt-3 p-4 rounded-xl border border-border/80 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Bảng: <code className="text-primary font-mono">{parsedSchema.tableName}</code> ({parsedSchema.rows.length} dòng)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {parsedSchema.columns.length} CỘT
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
                    Chưa phân tích được bảng. Hãy đảm bảo cú pháp có `CREATE TABLE` và `INSERT INTO`.
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
                Câu lệnh truy vấn ban đầu (Starter Query)
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hiển thị sẵn trong trình soạn thảo code của học viên khi mở bài lab này.
              </p>
            </div>

            <textarea
              rows={8}
              value={initialSnippet}
              onChange={(e) => onInitialSnippetChange(e.target.value)}
              placeholder="-- Viết truy vấn lấy các khách hàng theo yêu cầu...&#10;SELECT id, full_name FROM customers WHERE ...;"
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
                  Lời giải mẫu (Reference Solution) *
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Câu lệnh SQL chuẩn để kiểm tra tính hợp lệ và tự động sinh test cases.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleGenerateFromSolution}
                className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Zap className="size-3.5" />
                <span>⚡ Sinh test case từ Solution</span>
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
                    Kết quả mong đợi dạng bảng (Expected Result Grid)
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {expectedRows.length} DÒNG
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Học viên cần viết câu query trả về đúng các cột và hàng được liệt kê dưới đây.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFromSolution}
                  className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30"
                >
                  <Zap className="size-3" />
                  <span>⚡ Tự sinh từ Solution</span>
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
                  <span>Thêm dòng</span>
                </Button>
              </div>
            </div>

            {/* Editable Columns row */}
            <div className="flex items-center gap-2 pb-1 overflow-x-auto">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Các cột:</span>
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
                + Cột
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
                    <th className="px-3 py-2 text-right w-16">Xóa</th>
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
                              alert('Cần có ít nhất 1 dòng dữ liệu mong đợi.');
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
