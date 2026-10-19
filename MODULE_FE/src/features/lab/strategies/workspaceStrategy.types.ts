import type React from 'react';
import type { PracticeLabV1, SubmitLabPayload, SubmitLabResult } from '@/types/lab.types';

export interface WorkspaceStrategyProps {
  lab: PracticeLabV1;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: (payload: SubmitLabPayload) => Promise<SubmitLabResult>;
  isSubmitting?: boolean;
  onRunTest?: () => void;
  onResetCode?: () => void;
}

export type WorkspaceStrategyComponent = React.ComponentType<WorkspaceStrategyProps>;

export interface StrategyRegistryMap {
  [sandboxType: string]: WorkspaceStrategyComponent;
}
