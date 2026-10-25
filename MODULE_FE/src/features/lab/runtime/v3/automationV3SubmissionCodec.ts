/**
 * automationV3SubmissionCodec.ts
 *
 * Encodes and decodes Automation V3 submission payloads into submittedCode.
 * Stores exerciseRevision, stepPlan, answers, generated Playwright code,
 * resultSummary, and execution duration without requiring database schema migration.
 */

import type { AutomationStep } from '@/types/lab.types';

export interface AutomationV3SubmissionPayload {
  version: '3.0';
  exerciseRevision: string;
  stepPlan: AutomationStep[];
  answers?: Record<string, any>;
  generatedCode: string;
  generatedPlaywrightCode?: string;
  status?: 'passed' | 'failed';
  timeMs?: number;
  durationMs?: number;
  resultSummary?: {
    passedChecks: string[];
    failedChecks: string[];
    totalSteps: number;
  };
  submittedAt?: string;
}

const SUBMISSION_PREFIX = '/* AUTOMATION_V3_SUBMISSION:';
const SUBMISSION_SUFFIX = '*/';

function normalizePayload(parsed: any): AutomationV3SubmissionPayload | null {
  if (!parsed || parsed.version !== '3.0' || !Array.isArray(parsed.stepPlan)) return null;
  const generatedCode = parsed.generatedCode || parsed.generatedPlaywrightCode || '';
  const timeMs = typeof parsed.timeMs === 'number' ? parsed.timeMs : (typeof parsed.durationMs === 'number' ? parsed.durationMs : 0);
  return {
    ...parsed,
    generatedCode,
    generatedPlaywrightCode: parsed.generatedPlaywrightCode || generatedCode,
    status: parsed.status || 'passed',
    timeMs,
    durationMs: parsed.durationMs ?? timeMs,
    submittedAt: parsed.submittedAt || new Date().toISOString(),
  };
}

export function encodeAutomationV3Submission(payload: AutomationV3SubmissionPayload): string {
  const generatedCode = payload.generatedCode || payload.generatedPlaywrightCode || '';
  const timeMs = typeof payload.timeMs === 'number' ? payload.timeMs : (typeof payload.durationMs === 'number' ? payload.durationMs : 0);
  const normalized: AutomationV3SubmissionPayload = {
    ...payload,
    generatedCode,
    generatedPlaywrightCode: payload.generatedPlaywrightCode || generatedCode,
    status: payload.status || 'passed',
    timeMs,
    durationMs: payload.durationMs ?? timeMs,
    submittedAt: payload.submittedAt || new Date().toISOString(),
  };
  const jsonStr = JSON.stringify(normalized);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return `${SUBMISSION_PREFIX}${base64}${SUBMISSION_SUFFIX}\n\n${normalized.generatedCode}`;
}

export function decodeAutomationV3Submission(
  rawSubmittedCode: string | null | undefined,
): AutomationV3SubmissionPayload | null {
  if (!rawSubmittedCode || typeof rawSubmittedCode !== 'string') return null;

  const prefixIdx = rawSubmittedCode.indexOf(SUBMISSION_PREFIX);
  const suffixIdx = rawSubmittedCode.indexOf(SUBMISSION_SUFFIX);

  if (prefixIdx === -1 || suffixIdx === -1 || suffixIdx <= prefixIdx) {
    // If not encoded with prefix, attempt direct JSON parse
    try {
      const parsed = JSON.parse(rawSubmittedCode.trim());
      return normalizePayload(parsed);
    } catch {
      return null;
    }
  }

  const base64Content = rawSubmittedCode.slice(prefixIdx + SUBMISSION_PREFIX.length, suffixIdx).trim();
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64Content)));
    const parsed = JSON.parse(jsonStr);
    return normalizePayload(parsed);
  } catch {
    return null;
  }
}
