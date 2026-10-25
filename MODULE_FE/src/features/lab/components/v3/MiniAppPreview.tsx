import React, { useEffect, useRef } from 'react';
import { fixtureRegistry } from '../../runtime/v3/fixtureRegistry';
import { Monitor, RefreshCw, Maximize2, Minimize2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { StepExecutionResult } from '../../runtime/v3/blockRunner';
import { Badge } from '@/components/ui/badge';

interface MiniAppPreviewProps {
  fixtureId: string;
  currentRoute: string;
  stepResults?: StepExecutionResult[];
  activeStepIndex?: number | null;
  highlightSelector?: string | null;
  onResetFixture?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const MiniAppPreview: React.FC<MiniAppPreviewProps> = ({
  fixtureId,
  currentRoute,
  stepResults = [],
  activeStepIndex = null,
  highlightSelector = null,
  onResetFixture,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fixture = fixtureRegistry.get(fixtureId);

  useEffect(() => {
    if (!containerRef.current || !fixture) return;
    const normalized = currentRoute.split('?')[0];
    const routeDef = fixture.routes[normalized] || fixture.routes[fixture.defaultRoute];
    if (routeDef) {
      containerRef.current.innerHTML = routeDef.html;
    }

    if (highlightSelector) {
      try {
        const target = containerRef.current.querySelector(highlightSelector);
        if (target) {
          target.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2', 'transition-all');
        }
      } catch {
        // Safe fallback for non-CSS selectors
      }
    }
  }, [fixtureId, currentRoute, fixture, highlightSelector]);

  return (
    <div
      className={`flex flex-col bg-card border-l border-border h-full transition-all ${
        isCollapsed ? 'w-12' : 'w-full'
      }`}
      role="region"
      aria-label="Client Scenario Runner Preview"
    >
      {/* Top Bar with mandatory Client Scenario Runner labeling */}
      <div className="h-9 px-3 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Monitor className="size-3.5 text-blue-500 shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-foreground truncate">Client Scenario Runner</span>
              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
                In-Memory Sandbox
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background border border-border text-[11px] font-mono text-muted-foreground mr-1">
              <span>Route:</span>
              <span className="text-foreground font-semibold">{currentRoute}</span>
            </div>
          )}

          {onResetFixture && !isCollapsed && (
            <button
              type="button"
              onClick={onResetFixture}
              aria-label="Reset Mini App"
              className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand Preview' : 'Collapse Preview'}
              className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {isCollapsed ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Simulated App Viewport */}
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 border-b border-border">
            <div className="max-w-md mx-auto bg-background rounded-lg border border-border shadow-sm min-h-[220px]">
              <div
                ref={containerRef}
                className="mini-app-sandbox-content"
                id="mini-app-preview-container"
              />
            </div>
          </div>

          {/* Action Execution Timeline */}
          {stepResults.length > 0 && (
            <div className="h-44 border-t border-border bg-card p-3 overflow-y-auto space-y-1.5 shrink-0">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Action Timeline ({stepResults.length} steps)</span>
              </div>
              {stepResults.map((res, i) => (
                <div
                  key={res.stepId}
                  className={`flex items-center justify-between text-xs p-1.5 rounded border ${
                    activeStepIndex === i ? 'ring-2 ring-primary ring-offset-1 font-semibold ' : ''
                  }${
                    res.status === 'passed'
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                      : res.status === 'failed'
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {res.status === 'passed' ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : res.status === 'failed' ? (
                      <XCircle className="size-3.5 text-destructive shrink-0" />
                    ) : (
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono text-[10px]">#{i + 1}</span>
                    <span className="font-medium truncate">{res.blockType}</span>
                    {res.message && <span className="text-[11px] opacity-80 truncate">— {res.message}</span>}
                  </div>
                  <span className="font-mono text-[10px] shrink-0">{res.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
