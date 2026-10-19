import type { WorkspaceStrategyProps } from './workspaceStrategy.types';
import { AlertCircle } from 'lucide-react';

export function FallbackWorkspace({ lab }: WorkspaceStrategyProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/10">
      <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
        <AlertCircle className="size-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-foreground">Sandbox Type Not Supported</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The requested sandbox type <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{lab.sandboxType}</code> is currently not supported or under maintenance.
        </p>
      </div>
    </div>
  );
}
