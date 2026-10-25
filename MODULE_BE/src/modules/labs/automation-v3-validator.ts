import { BadRequestException } from '@nestjs/common';

export interface DecodedV3Submission {
  version: '3.0';
  exerciseRevision: string;
  stepPlan: Array<{
    id: string;
    blockType: string;
    category?: string;
    params: Record<string, any>;
  }>;
  generatedCode: string;
  generatedPlaywrightCode?: string;
  status: 'passed' | 'failed';
  timeMs: number;
  durationMs?: number;
}

const SUBMISSION_PREFIX = '/* AUTOMATION_V3_SUBMISSION:';
const SUBMISSION_SUFFIX = '*/';

function normalizeDecodedPayload(parsed: any): DecodedV3Submission | null {
  if (!parsed || parsed.version !== '3.0') return null;
  const generatedCode = parsed.generatedCode || parsed.generatedPlaywrightCode || '';
  const timeMs = typeof parsed.timeMs === 'number' ? parsed.timeMs : (typeof parsed.durationMs === 'number' ? parsed.durationMs : 50);
  return {
    ...parsed,
    generatedCode,
    timeMs,
  };
}

export function decodeV3SubmissionPayload(rawCode: string | null | undefined): DecodedV3Submission | null {
  if (!rawCode || typeof rawCode !== 'string') return null;

  const prefixIdx = rawCode.indexOf(SUBMISSION_PREFIX);
  const suffixIdx = rawCode.indexOf(SUBMISSION_SUFFIX);

  if (prefixIdx !== -1 && suffixIdx !== -1 && suffixIdx > prefixIdx) {
    const base64Content = rawCode.slice(prefixIdx + SUBMISSION_PREFIX.length, suffixIdx).trim();
    try {
      const jsonStr = Buffer.from(base64Content, 'base64').toString('utf-8');
      const parsed = JSON.parse(jsonStr);
      return normalizeDecodedPayload(parsed);
    } catch {
      return null;
    }
  }

  // Fallback: direct JSON
  try {
    const parsed = JSON.parse(rawCode.trim());
    if (parsed && parsed.version === '3.0' && Array.isArray(parsed.stepPlan)) {
      return normalizeDecodedPayload(parsed);
    }
  } catch {
    return null;
  }

  return null;
}

const TYPE_ACTION_TO_BLOCK_TYPE: Record<string, string> = {
  'navigation.goto': 'nav_goto',
  'action.click': 'act_click',
  'action.fill': 'act_fill',
  'action.check': 'act_check',
  'action.selectOption': 'act_select_option',
  'assertion.toBeVisible': 'assert_visible',
  'assertion.toHaveText': 'assert_text',
  'assertion.toHaveValue': 'assert_value',
  'assertion.toHaveCount': 'assert_count',
  'assertion.toHaveURL': 'assert_url',
};

function getTargetBlockType(req: Record<string, any>): string {
  if (req.blockType) return req.blockType;
  if (req.type && req.action) {
    const key = `${req.type}.${req.action}`;
    return TYPE_ACTION_TO_BLOCK_TYPE[key] || `${req.type}_${req.action}`;
  }
  return 'specified step';
}

function matchesRequiredStep(
  step: { blockType: string; category?: string; params: Record<string, any> },
  req: Record<string, any>,
): boolean {
  // 1. Determine target block type
  const targetBlock = getTargetBlockType(req);

  if (targetBlock !== 'specified step' && step.blockType !== targetBlock) {
    return false;
  }

  // 2. Target URL check
  if (req.targetUrl) {
    const stepUrl = step.params?.route ?? step.params?.targetUrl ?? step.params?.url;
    if (String(stepUrl || '').trim() !== String(req.targetUrl).trim()) {
      return false;
    }
  }

  // 3. Target Locator check
  if (req.target) {
    const stepTarget = step.params?.locator ?? step.params?.target;
    if (!String(stepTarget || '').includes(String(req.target).trim())) {
      return false;
    }
  }

  // 4. Expected value check
  if (req.expected !== undefined) {
    const stepVal = step.params?.expected ?? step.params?.value;
    if (String(stepVal ?? '').trim() !== String(req.expected).trim()) {
      return false;
    }
  }

  // 5. Arbitrary params match
  if (req.paramsMatch && typeof req.paramsMatch === 'object') {
    for (const [k, v] of Object.entries(req.paramsMatch)) {
      if (String(step.params?.[k] ?? '').trim() !== String(v).trim()) {
        return false;
      }
    }
  }

  return true;
}

export function validateV3AutomationSubmission(
  rawSubmittedCode: string,
  rawConfig: Record<string, any>,
): { status: 'passed' | 'failed'; timeMs: number; testLogs?: string } {
  const decoded = decodeV3SubmissionPayload(rawSubmittedCode);
  if (!decoded) {
    throw new BadRequestException('Invalid Automation V3 submission: malformed or missing submission payload.');
  }

  // 1. Revision Check
  const expectedRevision = rawConfig.contentRevision || rawConfig.gradingKey?.exerciseRevision;
  if (expectedRevision && decoded.exerciseRevision !== expectedRevision) {
    throw new BadRequestException(
      `Submission revision mismatch: expected "${expectedRevision}", received "${decoded.exerciseRevision}". Please refresh to get latest lesson updates.`,
    );
  }

  // 2. Step limits (Max 50 steps)
  if (!Array.isArray(decoded.stepPlan) || decoded.stepPlan.length === 0) {
    throw new BadRequestException('Submission rejected: step plan is empty.');
  }
  if (decoded.stepPlan.length > 50) {
    throw new BadRequestException(`Submission rejected: step count (${decoded.stepPlan.length}) exceeds 50-step maximum limit.`);
  }

  // 3. Allowlist validation
  const allowedBlocks = Array.isArray(rawConfig.allowedBlocks) ? rawConfig.allowedBlocks : [];
  if (allowedBlocks.length > 0) {
    const allowedSet = new Set(allowedBlocks.map((b: any) => b.blockType || b.id));
    for (const step of decoded.stepPlan) {
      if (!allowedSet.has(step.blockType)) {
        throw new BadRequestException(
          `Submission rejected: blockType "${step.blockType}" is not permitted in this exercise.`,
        );
      }
    }
  }

  // 4. Server-Side Grading Rules & Grading Key Enforcement
  const rulesToCheck: Array<{
    requiredSteps?: any[];
    forbiddenPatterns?: string[];
    feedback?: string;
  }> = [];

  if (Array.isArray(rawConfig.gradingRules)) {
    rulesToCheck.push(...rawConfig.gradingRules);
  }

  if (rawConfig.gradingKey && typeof rawConfig.gradingKey === 'object') {
    rulesToCheck.push({
      requiredSteps: Array.isArray(rawConfig.gradingKey.requiredSteps) ? rawConfig.gradingKey.requiredSteps : undefined,
      forbiddenPatterns: Array.isArray(rawConfig.gradingKey.forbiddenPatterns) ? rawConfig.gradingKey.forbiddenPatterns : undefined,
      feedback: 'Server Grading Key check failed.',
    });
  }

  for (const rule of rulesToCheck) {
    // Check required steps
    if (Array.isArray(rule.requiredSteps)) {
      for (const req of rule.requiredSteps) {
        const found = decoded.stepPlan.some((s) => matchesRequiredStep(s, req));
        if (!found) {
          const reqDesc = getTargetBlockType(req);
          return {
            status: 'failed',
            timeMs: decoded.timeMs || 0,
            testLogs: `Server Verification Failed: Missing required step (${reqDesc}). ${rule.feedback || ''}`,
          };
        }
      }
    }

    // Check forbidden patterns
    if (Array.isArray(rule.forbiddenPatterns)) {
      for (const pattern of rule.forbiddenPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(decoded.generatedCode || '')) {
          return {
            status: 'failed',
            timeMs: decoded.timeMs || 0,
            testLogs: `Server Verification Failed: Code contains forbidden pattern "${pattern}". ${rule.feedback || ''}`,
          };
        }
      }
    }
  }

  const hasRules = rulesToCheck.length > 0;
  if (!hasRules) {
    return {
      status: 'failed',
      timeMs: decoded.timeMs || 50,
      testLogs: 'Server Verification Failed: Lab has no authoritative grading rules or grading key configured.',
    };
  }

  return {
    status: 'passed',
    timeMs: decoded.timeMs || 50,
    testLogs: 'All server-side declarative plan verification checks passed.',
  };
}
