/**
 * useLabWorker — Worker Bridge Hook
 *
 * Workflow ref: Docs/workflows/03-webworker-execution.md
 *
 * - Spawns a fresh Web Worker per execution (clean state every run)
 * - Enforces a 2000ms Timeout Guard; auto-terminates stuck workers
 * - Returns `run(code, testScript)` + reactive `result` / `status`
 */
import { useState, useRef, useCallback } from 'react';
import type { WorkerResult } from '@/types/lab.types';

export type RunnerStatus = 'idle' | 'running' | 'done' | 'timeout' | 'error';

const TIMEOUT_MS = 2000;

export function useLabWorker() {
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [result, setResult] = useState<WorkerResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = null;
    timerRef.current = null;
  }, []);

  const run = useCallback(
    (submittedCode: string, testScript: string) => {
      cleanup();
      setStatus('running');
      setResult(null);

      // Vite handles ?worker import — Web Worker runs on its own OS thread
      const worker = new Worker(
        new URL('../workers/lab-runner.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // ── Timeout Guard (Workflow step: Bật đếm thời gian giới hạn 2000ms) ──
      timerRef.current = setTimeout(() => {
        cleanup();
        setStatus('timeout');
        setResult({
          passed: false,
          timeMs: TIMEOUT_MS,
          testCases: [],
          logs: [],
          error: `Time Limit Exceeded (>${TIMEOUT_MS}ms) — vòng lặp vô tận hoặc tác vụ quá nặng.`,
        });
      }, TIMEOUT_MS);

      // ── Worker message handler ─────────────────────────────────────────────
      worker.onmessage = (event: MessageEvent<WorkerResult>) => {
        cleanup();
        setResult(event.data);
        setStatus('done');
      };

      worker.onerror = (err) => {
        cleanup();
        setStatus('error');
        setResult({
          passed: false,
          timeMs: 0,
          testCases: [],
          logs: [],
          error: err.message,
        });
      };

      worker.postMessage({ submittedCode, testScript });
    },
    [cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setResult(null);
  }, [cleanup]);

  return { run, reset, status, result };
}
