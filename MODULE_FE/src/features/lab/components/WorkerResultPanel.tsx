/**
 * WorkerResultPanel
 *
 * Displays the result of the Web Worker execution:
 *  - Running indicator
 *  - Test case list (passed / failed)
 *  - Console logs
 *  - Timeout / Error banner
 *
 * Design: shadcn/ui components (Badge, Alert, Card), zero icons.
 */
import { Badge } from '@/components/ui/badge';
import type { RunnerStatus } from '@/features/lab/hooks/useLabWorker';
import type { WorkerResult, WorkerTestCase } from '@/types/lab.types';

interface Props {
  status: RunnerStatus;
  result: WorkerResult | null;
}

export function WorkerResultPanel({ status, result }: Props) {
  if (status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        Click <strong className="mx-1 text-foreground">Run Tests</strong> to execute your code
      </div>
    );
  }

  if (status === 'running') {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-xs">
        <span className="size-2 rounded-full bg-primary animate-ping" />
        Executing test suite…
      </div>
    );
  }

  if (!result) return null;

  const isTimeout = status === 'timeout';
  const allPassed = result.passed;

  return (
    <div className="flex flex-col gap-3 text-xs h-full overflow-y-auto p-1">
      {/* ── Summary banner ─────────────────────────────────────── */}
      {isTimeout ? (
        <StatusBanner
          tag="TIMEOUT"
          label="Time Limit Exceeded"
          detail="Exceeded 2000ms limit — check for potential infinite loops"
          variant="warn"
        />
      ) : result.error ? (
        <StatusBanner
          tag="ERROR"
          label="Execution Error"
          detail={result.error}
          variant="error"
        />
      ) : allPassed ? (
        <StatusBanner
          tag="PASS"
          label={`All tests passed successfully (${result.timeMs}ms)`}
          variant="pass"
        />
      ) : (
        <StatusBanner
          tag="FAIL"
          label={`Failed — ${result.testCases.filter((t) => !t.passed).length} test(s) failed`}
          variant="fail"
        />
      )}

      {/* ── Test Cases ─────────────────────────────────────────── */}
      {result.testCases.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Test Cases
          </p>
          {result.testCases.map((tc, i) => (
            <TestCaseRow key={i} tc={tc} />
          ))}
        </div>
      )}

      {/* ── Console Logs ───────────────────────────────────────── */}
      {result.logs.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Console Output
          </p>
          <div className="bg-muted/50 rounded-md p-3 font-mono text-[11px] text-foreground space-y-0.5 leading-relaxed border border-border">
            {result.logs.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components (No Icons) ──────────────────────────────────────────────────

function TestCaseRow({ tc }: { tc: WorkerTestCase }) {
  return (
    <div
      className={`flex flex-col gap-1.5 p-2.5 rounded-lg border text-xs transition-colors ${
        tc.passed
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-destructive/30 bg-destructive/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5">
          <span className={tc.passed ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
            {tc.passed ? '✓' : '✗'}
          </span>
          <p className="font-semibold text-foreground truncate">{tc.name}</p>
        </div>
        <Badge
          variant={tc.passed ? 'outline' : 'destructive'}
          className={`ml-auto shrink-0 text-[10px] h-4.5 px-1.5 font-bold ${
            tc.passed ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''
          }`}
        >
          {tc.passed ? 'PASS' : 'FAIL'}
        </Badge>
      </div>

      {tc.message && (
        <p className="text-[11px] text-muted-foreground ml-4 leading-relaxed">{tc.message}</p>
      )}

      {!tc.passed && (tc.expected !== undefined || tc.actual !== undefined || tc.hint) && (
        <div className="ml-4 mt-1 p-2 bg-muted/60 rounded border border-border/60 font-mono text-[11px] space-y-1">
          {tc.expected !== undefined && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="font-semibold text-muted-foreground w-20">Expected:</span>
              <span className="bg-emerald-500/10 px-1 py-0.5 rounded font-mono">{String(tc.expected)}</span>
            </div>
          )}
          {tc.actual !== undefined && (
            <div className="flex items-center gap-2 text-destructive">
              <span className="font-semibold text-muted-foreground w-20">Actual:</span>
              <span className="bg-destructive/10 px-1 py-0.5 rounded font-mono">{String(tc.actual)}</span>
            </div>
          )}
          {tc.hint && (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 pt-1 font-sans">
              <span className="font-semibold text-muted-foreground w-20 shrink-0">💡 Gợi ý:</span>
              <span className="leading-snug">{tc.hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type BannerVariant = 'pass' | 'fail' | 'warn' | 'error';

function StatusBanner({
  tag,
  label,
  detail,
  variant,
}: {
  tag: string;
  label: string;
  detail?: string;
  variant: BannerVariant;
}) {
  const styles: Record<BannerVariant, string> = {
    pass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    fail: 'bg-destructive/10 border-destructive/30 text-destructive',
    warn: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300',
    error: 'bg-destructive/10 border-destructive/30 text-destructive',
  };

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${styles[variant]}`}>
      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 shrink-0 font-mono font-bold">
        {tag}
      </Badge>
      <div>
        <p className="font-semibold text-xs">{label}</p>
        {detail && <p className="text-[11px] mt-0.5 opacity-90">{detail}</p>}
      </div>
    </div>
  );
}
