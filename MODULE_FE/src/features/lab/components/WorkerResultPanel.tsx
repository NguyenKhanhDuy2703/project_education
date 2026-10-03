/**
 * WorkerResultPanel
 *
 * Displays the result of the Web Worker execution:
 *  - Running spinner
 *  - Test case list (passed / failed)
 *  - Console logs
 *  - Timeout / Error banner
 *
 * Design system: Meta flat — no gradients, primary=#0866FF, card bg=#fff
 */
import { CheckCircle2, XCircle, Clock, AlertTriangle, Terminal } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Terminal className="size-4 mr-2" />
        Nhấn <strong className="mx-1 text-foreground">Chạy kiểm thử</strong> để xem kết quả
      </div>
    );
  }

  if (status === 'running') {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground text-sm">
        <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Đang chạy kiểm thử…
      </div>
    );
  }

  if (!result) return null;

  const isTimeout = status === 'timeout';
  const allPassed = result.passed;

  return (
    <div className="flex flex-col gap-4 text-sm h-full overflow-y-auto p-1">
      {/* ── Summary banner ─────────────────────────────────────── */}
      {isTimeout ? (
        <StatusBanner
          icon={Clock}
          label="Time Limit Exceeded"
          detail={`Vượt quá 2000ms — kiểm tra vòng lặp vô tận`}
          variant="warn"
        />
      ) : result.error ? (
        <StatusBanner
          icon={AlertTriangle}
          label="Lỗi thực thi"
          detail={result.error}
          variant="error"
        />
      ) : allPassed ? (
        <StatusBanner
          icon={CheckCircle2}
          label={`Tất cả test đã qua — ${result.timeMs}ms`}
          variant="pass"
        />
      ) : (
        <StatusBanner
          icon={XCircle}
          label={`Chưa đạt — ${result.testCases.filter((t) => !t.passed).length} test thất bại`}
          variant="fail"
        />
      )}

      {/* ── Test Cases ─────────────────────────────────────────── */}
      {result.testCases.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Console
          </p>
          <div className="bg-muted/50 rounded-md p-3 font-mono text-xs text-foreground space-y-0.5 leading-relaxed">
            {result.logs.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TestCaseRow({ tc }: { tc: WorkerTestCase }) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-md border ${
        tc.passed ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : 'border-destructive/30 bg-destructive/5'
      }`}
    >
      {tc.passed ? (
        <CheckCircle2 className="size-3.5 text-green-600 shrink-0 mt-px" />
      ) : (
        <XCircle className="size-3.5 text-destructive shrink-0 mt-px" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{tc.name}</p>
        {tc.message && <p className="text-xs text-muted-foreground mt-0.5">{tc.message}</p>}
      </div>
      <Badge
        variant={tc.passed ? 'outline' : 'destructive'}
        className="ml-auto shrink-0 text-[10px] h-4 px-1.5"
      >
        {tc.passed ? 'PASS' : 'FAIL'}
      </Badge>
    </div>
  );
}

type BannerVariant = 'pass' | 'fail' | 'warn' | 'error';

function StatusBanner({
  icon: Icon,
  label,
  detail,
  variant,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  detail?: string;
  variant: BannerVariant;
}) {
  const styles: Record<BannerVariant, string> = {
    pass: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400',
    fail: 'bg-destructive/5 border-destructive/30 text-destructive',
    warn: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400',
    error: 'bg-destructive/5 border-destructive/30 text-destructive',
  };

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${styles[variant]}`}>
      <Icon className="size-4 shrink-0 mt-px" />
      <div>
        <p className="font-semibold text-sm">{label}</p>
        {detail && <p className="text-xs mt-0.5 opacity-80">{detail}</p>}
      </div>
    </div>
  );
}
