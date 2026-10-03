/**
 * LabWorkspacePage — /labs/:labId
 *
 * 2-column layout: Instructions (left) | Code Editor + Result (right)
 * Workflows covered:
 *   - 02-lab-access-rbac.md  → 403 → UpgradeModal
 *   - 03-webworker-execution.md → useLabWorker (run / timeout / result)
 *   - 04-lab-submission-progress.md → Submit after pass
 *
 * Design: Meta flat, muted sidebar, primary CTA only on "Nộp bài".
 *
 * NOTE: Monaco Editor is lazy-loaded via dynamic import to keep
 *       initial bundle size small. Vite + @monaco-editor/react handles HMR.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { labApi } from '@/features/lab/api/lab.api';
import { useLabWorker } from '@/features/lab/hooks/useLabWorker';
import { WorkerResultPanel } from '@/features/lab/components/WorkerResultPanel';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlayCircle,
  SendHorizonal,
  ChevronLeft,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { AxiosError } from 'axios';

// Monaco is loaded on demand (large dependency)
import Editor from '@monaco-editor/react';

export function LabWorkspacePage() {
  const { labId } = useParams<{ labId: string }>();
  const qc = useQueryClient();

  const [code, setCode] = useState<string>('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { run, status: workerStatus, result } = useLabWorker();

  // ── Fetch lab detail (RBAC: 403 → UpgradeModal) ──────────────────────────
  const { data: lab, isLoading, isError, error } = useQuery({
    queryKey: ['lab', labId],
    queryFn: () => labApi.getById(labId!),
    enabled: !!labId,
    retry: false,
  });

  const is403 = (error as AxiosError)?.response?.status === 403;

  // Initialise code editor with starter snippet when lab loads
  const handleEditorMount = useCallback(() => {
    if (lab?.initialSnippet) {
      setCode(lab.initialSnippet);
    }
  }, [lab]);

  // ── Submission mutation (Workflow 04) ─────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () =>
      labApi.submit(labId!, {
        submittedCode: code,
        status: result?.passed ? 'passed' : 'failed',
        timeMs: result?.timeMs ?? 0,
      }),
    onSuccess: () => {
      setSubmitted(true);
      // Invalidate dashboard stats so progress refreshes
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // ── Run handler ────────────────────────────────────────────────────────────
  const handleRun = () => {
    if (!lab || workerStatus === 'running') return;
    run(code, lab.testScript);
    setSubmitted(false);
  };

  // ── Guard: 403 ─────────────────────────────────────────────────────────────
  if (is403) {
    return (
      <>
        <div className="container mx-auto px-4 py-10 max-w-3xl text-center space-y-4">
          <Lock className="size-10 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">Nội dung dành cho Pro</p>
          <p className="text-sm text-muted-foreground">Nâng cấp tài khoản để mở khóa bài lab này.</p>
          <Button onClick={() => setShowUpgrade(true)}>Xem thông tin nâng cấp</Button>
        </div>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </>
    );
  }

  if (isLoading) return <WorkspaceSkeleton />;

  if (isError || !lab) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Không thể tải bài lab. Vui lòng thử lại.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/series`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <p className="text-sm font-semibold text-foreground truncate">{lab.title}</p>
          {lab.isProOnly && (
            <Badge variant="secondary" className="text-[10px] gap-0.5 h-5 px-1.5 shrink-0">
              <Lock className="size-2.5" /> Pro
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
            <Clock className="size-3.5" />
            {lab.estimatedMinutes} phút
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRun}
            disabled={workerStatus === 'running'}
            id="btn-run-test"
            className="gap-1.5 h-8"
          >
            <PlayCircle className="size-3.5" />
            {workerStatus === 'running' ? 'Đang chạy…' : 'Chạy kiểm thử'}
          </Button>

          {result?.passed && !submitted && (
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              id="btn-submit-lab"
              className="gap-1.5 h-8 font-semibold"
            >
              <SendHorizonal className="size-3.5" />
              {submitMutation.isPending ? 'Đang nộp…' : 'Nộp bài'}
            </Button>
          )}

          {submitted && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              Đã nộp
            </span>
          )}
        </div>
      </div>

      {/* ── 2-column workspace ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Instructions (Markdown rendered as HTML) */}
        <aside className="w-2/5 border-r border-border overflow-y-auto bg-card p-5 shrink-0 hidden md:block">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Hướng dẫn
          </h2>
          <div
            className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(lab.instructions) }}
          />
        </aside>

        {/* Right: Editor + Result */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code || lab.initialSnippet}
              onChange={(v) => setCode(v ?? '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbers: 'on',
              }}
              theme="vs-dark"
            />
          </div>

          {/* Result panel */}
          <div className="h-48 border-t border-border bg-card p-4 overflow-hidden shrink-0">
            <WorkerResultPanel status={workerStatus} result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tiny markdown → HTML (no external dep) ───────────────────────────────────
// For a production app, use react-markdown. This handles the basics.
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="h-12 border-b border-border bg-card" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 border-r border-border p-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="flex-1 bg-[#1e1e1e]" />
      </div>
    </div>
  );
}
