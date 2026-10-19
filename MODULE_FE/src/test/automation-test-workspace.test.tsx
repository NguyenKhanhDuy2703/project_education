import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutomationTestWorkspace } from '../features/lab/strategies/AutomationTestWorkspace';
import type { PracticeLabV1 } from '@/types/lab.types';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

const mockRun = vi.fn();
const mockReset = vi.fn();
let mockWorkerResult: any = null;

vi.mock('@/features/lab/hooks/useLabWorker', () => ({
  useLabWorker: () => ({
    status: mockWorkerResult ? 'done' : 'idle',
    result: mockWorkerResult,
    run: mockRun,
    reset: mockReset,
  }),
}));

describe('AutomationTestWorkspace Component Suite (Subtask 4.5 & 4.6)', () => {
  const mockLab: Partial<PracticeLabV1> = {
    id: 'lab-auto-1',
    slug: 'api-automation-test',
    title: 'API Status & Schema Verification',
    sandboxType: 'js_worker',
    envelope: {
      version: '1.0',
      sandboxType: 'js_worker',
      instructions: '# Test Instructions',
      initialSnippet: 'expect(res.status).toBe(200);',
      testScript: 'test("status 200", () => expect(res.status).toBe(200));',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerResult = null;
  });

  it('renders editor, run buttons, and initial empty result prompt', () => {
    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(1).toBe(1);"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/API Automation Test Script/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Run Tests/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeDefined();
    expect(screen.getByText('No test results yet')).toBeDefined();
  });

  it('triggers runWorker when clicking Run Tests', () => {
    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(res.status).toBe(200);"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    const runBtn = screen.getByRole('button', { name: /Run Tests/i });
    fireEvent.click(runBtn);

    expect(mockReset).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalledWith(
      'expect(res.status).toBe(200);',
      mockLab.envelope?.testScript,
    );
  });

  it('renders passed step cards when worker returns success', () => {
    mockWorkerResult = {
      protocolVersion: '1.0',
      passed: true,
      timeMs: 45,
      testCases: [
        { name: 'Response status is 200', passed: true, executionTimeMs: 12 },
        { name: 'Payload contains accessToken', passed: true, executionTimeMs: 15 },
      ],
      logs: ['[INFO] status test completed'],
    };

    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(1).toBe(1);"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('ALL ASSERTIONS PASSED')).toBeDefined();
    expect(screen.getByText('Response status is 200')).toBeDefined();
    expect(screen.getByText('Payload contains accessToken')).toBeDefined();
  });

  it('renders Smart Cloze mode with locked code, blanks chip, and form controls', () => {
    const mockClozeLab: Partial<PracticeLabV1> = {
      id: 'lab-auto-cloze',
      slug: 'api-cloze-test',
      title: 'Auth Status Verification',
      sandboxType: 'js_worker',
      envelope: {
        version: '2.0',
        sandboxType: 'js_worker',
        instructions: '# Test Instructions',
        initialSnippet: '',
        testScript: 'test("check status", () => expect(res.status).toBe(200));',
        config: {
          version: '2.0',
          interactionMode: 'smart_cloze',
          framework: 'api',
          publicTemplate: [
            { kind: 'readonly', text: 'expect(res.status).toBe(' },
            { kind: 'blank', blankId: 'status' },
            { kind: 'readonly', text: ');' },
          ],
          blanks: [
            {
              id: 'status',
              kind: 'http_status',
              label: 'HTTP Status Code',
              valueType: 'number',
              defaultValue: 200,
              options: [
                { value: 200, label: '200 OK' },
                { value: 401, label: '401 Unauthorized' },
              ],
            },
          ],
        },
      },
    };

    render(
      <AutomationTestWorkspace
        lab={mockClozeLab as PracticeLabV1}
        code=""
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Smart Cloze Automation Test/i)).toBeDefined();
    expect(screen.getByText(/blanks filled/i)).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'HTTP Status Code' })).toBeDefined();
  });

  it('submits status failed when test runner has not passed or failed', async () => {
    const mockSubmit = vi.fn();
    mockWorkerResult = {
      protocolVersion: '1.0',
      passed: false,
      timeMs: 30,
      testCases: [{ name: 'status check', passed: false, message: 'Expected 200, received 401' }],
      logs: [],
    };

    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(res.status).toBe(401);"
        onCodeChange={() => {}}
        onSubmit={mockSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed', // Verifies status is no longer hardcoded 'passed'
      }),
    );
  });

  it('submits status passed when tests succeed and have been run', async () => {
    const mockSubmit = vi.fn();
    mockWorkerResult = {
      protocolVersion: '1.0',
      passed: true,
      timeMs: 40,
      testCases: [{ name: 'status check', passed: true }],
      logs: [],
    };

    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(res.status).toBe(200);"
        onCodeChange={() => {}}
        onSubmit={mockSubmit}
      />,
    );

    // Learner runs tests first
    const runBtn = screen.getByRole('button', { name: /Run Tests/i });
    fireEvent.click(runBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'passed',
      }),
    );
  });

  it('invalidates passing run and submits failed if Monaco editor is modified after running', async () => {
    const mockSubmit = vi.fn();
    mockWorkerResult = {
      protocolVersion: '1.0',
      passed: true,
      timeMs: 40,
      testCases: [{ name: 'status check', passed: true }],
      logs: [],
    };

    render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(res.status).toBe(200);"
        onCodeChange={() => {}}
        onSubmit={mockSubmit}
      />,
    );

    // 1. Run tests -> succeeds
    fireEvent.click(screen.getByRole('button', { name: /Run Tests/i }));

    // 2. Learner alters code in Monaco without re-running
    const editor = screen.getByTestId('monaco-mock');
    fireEvent.change(editor, { target: { value: 'expect(invalid).toBe(false);' } });

    // 3. Staleness warning appears
    expect(screen.getByText(/Code or answers modified since last run/i)).toBeDefined();

    // 4. Submitting now submits failed status instead of stale passed
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
      }),
    );
  });

  it('announces test results via aria-live polite region for screen reader accessibility', () => {
    mockWorkerResult = {
      protocolVersion: '1.0',
      passed: true,
      timeMs: 40,
      testCases: [{ name: 'step 1', passed: true }],
      logs: [],
    };

    const { container } = render(
      <AutomationTestWorkspace
        lab={mockLab as PracticeLabV1}
        code="expect(1).toBe(1);"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeDefined();
    expect(liveRegion?.textContent).toContain('test assertions passed');
  });
});

