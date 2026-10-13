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
      className={`flex items-start justify-between gap-2 p-2 rounded-lg border text-xs ${
        tc.passed
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-destructive/30 bg-destructive/5'
      }`}
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{tc.name}</p>
        {tc.message && <p className="text-[11px] text-muted-foreground mt-0.5">{tc.message}</p>}
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
