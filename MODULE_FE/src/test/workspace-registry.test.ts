import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  registerWorkspaceStrategy,
  getWorkspaceStrategy,
  clearWorkspaceRegistry,
  resetDefaultStrategies,
} from '../features/lab/strategies/workspaceRegistry';
import { FallbackWorkspace } from '../features/lab/strategies/FallbackWorkspace';
import type { WorkspaceStrategyProps } from '../features/lab/strategies/workspaceStrategy.types';

describe('Workspace Strategy Registry Suite (Subtask 3.4)', () => {
  beforeEach(() => {
    clearWorkspaceRegistry();
  });

  afterEach(() => {
    resetDefaultStrategies();
  });

  it('returns FallbackWorkspace when sandboxType is not registered', () => {
    const Component = getWorkspaceStrategy('unknown_type');
    expect(Component).toBe(FallbackWorkspace);
  });

  it('registers and retrieves a strategy component by sandboxType', () => {
    const CustomStrategy: React.FC<WorkspaceStrategyProps> = () => React.createElement('div', null, 'Custom Strategy');

    registerWorkspaceStrategy('js_worker', CustomStrategy);

    const Resolved = getWorkspaceStrategy('js_worker');
    expect(Resolved).toBe(CustomStrategy);
  });

  it('supports multiple strategy mappings without collisions', () => {
    const JsStrategy: React.FC<WorkspaceStrategyProps> = () => React.createElement('div', null, 'JS');
    const SqlStrategy: React.FC<WorkspaceStrategyProps> = () => React.createElement('div', null, 'SQL');

    registerWorkspaceStrategy('js_worker', JsStrategy);
    registerWorkspaceStrategy('sql_worker', SqlStrategy);

    expect(getWorkspaceStrategy('js_worker')).toBe(JsStrategy);
    expect(getWorkspaceStrategy('sql_worker')).toBe(SqlStrategy);
    expect(getWorkspaceStrategy('quizlet')).toBe(FallbackWorkspace);
  });

  it('maps default strategies to AutomationTestWorkspace, SqlPracticeWorkspace and QuizAssignmentWorkspace', () => {
    resetDefaultStrategies();
    expect(getWorkspaceStrategy('js_worker').name).toContain('AutomationTestWorkspace');
    expect(getWorkspaceStrategy('sql_worker')).not.toBe(FallbackWorkspace);
    expect(getWorkspaceStrategy('quizlet').name).toContain('QuizAssignmentWorkspace');
  });
});
