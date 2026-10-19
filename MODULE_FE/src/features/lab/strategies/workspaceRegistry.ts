import { lazy } from 'react';
import type { WorkspaceStrategyComponent, StrategyRegistryMap } from './workspaceStrategy.types';
import { FallbackWorkspace } from './FallbackWorkspace';
import { AutomationTestWorkspace } from './AutomationTestWorkspace';
import { QuizAssignmentWorkspace } from './QuizAssignmentWorkspace';

const SqlPracticeWorkspace = lazy(() =>
  import('./SqlPracticeWorkspace').then((module) => ({ default: module.SqlPracticeWorkspace })),
);

const registry: StrategyRegistryMap = {
  js_worker: AutomationTestWorkspace,
  sql_worker: SqlPracticeWorkspace,
  quizlet: QuizAssignmentWorkspace,
};

export function registerWorkspaceStrategy(
  sandboxType: string,
  component: WorkspaceStrategyComponent,
): void {
  registry[sandboxType] = component;
}

export function getWorkspaceStrategy(sandboxType: string): WorkspaceStrategyComponent {
  return registry[sandboxType] || FallbackWorkspace;
}

export function getAllRegisteredStrategies(): string[] {
  return Object.keys(registry);
}

export function resetDefaultStrategies(): void {
  Object.keys(registry).forEach((key) => {
    delete registry[key];
  });
  registry['js_worker'] = AutomationTestWorkspace;
  registry['sql_worker'] = SqlPracticeWorkspace;
  registry['quizlet'] = QuizAssignmentWorkspace;
}

export function clearWorkspaceRegistry(): void {
  Object.keys(registry).forEach((key) => {
    delete registry[key];
  });
}
