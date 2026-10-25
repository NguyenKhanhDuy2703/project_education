import { lazy } from 'react';
import type { WorkspaceStrategyComponent, StrategyRegistryMap } from './workspaceStrategy.types';
import { FallbackWorkspace } from './FallbackWorkspace';
import { AutomationTestWorkspace } from './AutomationTestWorkspace';
import { QuizAssignmentWorkspace } from './QuizAssignmentWorkspace';
import { AutomationV3Workspace } from './AutomationV3Workspace';
import { TheoryLessonView } from './TheoryLessonView';
import { isFeatureEnabled } from '@/config/features';

const SqlPracticeWorkspace = lazy(() =>
  import('./SqlPracticeWorkspace').then((module) => ({ default: module.SqlPracticeWorkspace })),
);

const registry: StrategyRegistryMap = {
  js_worker: AutomationTestWorkspace,
  sql_worker: SqlPracticeWorkspace,
  quizlet: QuizAssignmentWorkspace,
  automation_v3: AutomationV3Workspace,
  markdown_only: TheoryLessonView,
};

export function registerWorkspaceStrategy(
  sandboxType: string,
  component: WorkspaceStrategyComponent,
): void {
  registry[sandboxType] = component;
}

export function getWorkspaceStrategy(
  sandboxType: string,
  envelopeVersion?: string,
): WorkspaceStrategyComponent {
  if (envelopeVersion === '3.0' && isFeatureEnabled('AUTOMATION_V3_ENABLED')) {
    return AutomationV3Workspace;
  }
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
  registry['automation_v3'] = AutomationV3Workspace;
  registry['markdown_only'] = TheoryLessonView;
}

export function clearWorkspaceRegistry(): void {
  Object.keys(registry).forEach((key) => {
    delete registry[key];
  });
}
