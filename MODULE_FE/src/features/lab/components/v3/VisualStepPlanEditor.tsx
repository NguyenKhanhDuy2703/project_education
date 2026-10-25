import React from 'react';
import type { AutomationStep, AutomationBlockDefinition } from '@/types/lab.types';
import { BUILTIN_BLOCK_DEFINITIONS } from '../../runtime/v3/blockDsl';
import { ArrowUp, ArrowDown, Trash2, Lock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VisualStepPlanEditorProps {
  steps: AutomationStep[];
  allowedBlocks: AutomationBlockDefinition[];
  onUpdateStepParams: (stepId: string, paramId: string, val: any) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
  onRemoveStep: (stepId: string) => void;
  activeStepIndex?: number | null;
  stepErrors?: Record<string, string>;
  disabled?: boolean;
}

export const VisualStepPlanEditor: React.FC<VisualStepPlanEditorProps> = ({
  steps,
  allowedBlocks,
  onUpdateStepParams,
  onMoveStep,
  onRemoveStep,
  activeStepIndex = null,
  stepErrors = {},
  disabled = false,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto p-4 space-y-3" role="region" aria-label="Visual Step Plan Editor">
      {steps.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <p className="text-sm font-medium text-foreground">No steps in this test plan yet</p>
          <p className="text-xs mt-1">Select a block from the Syntax Palette on the left to start building your scenario.</p>
        </div>
      ) : (
        steps.map((step, idx) => {
          const blockDef =
            allowedBlocks.find((b) => b.blockType === step.blockType) ||
            BUILTIN_BLOCK_DEFINITIONS[step.blockType];

          const isCurrentExecuting = activeStepIndex === idx;
          const hasError = Boolean(stepErrors[step.id]);

          return (
            <div
              key={step.id}
              className={`rounded-lg border transition-all ${
                isCurrentExecuting
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : hasError
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-card shadow-sm hover:border-border/80'
              }`}
            >
              {/* Header */}
              <div className="h-10 px-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {blockDef ? blockDef.name : step.blockType}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                    {step.category}
                  </Badge>
                  {step.isLocked && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      <Lock className="size-3" /> Scaffolding
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={disabled || idx === 0 || step.isLocked}
                    onClick={() => onMoveStep(idx, 'up')}
                    aria-label={`Move Step ${idx + 1} Up`}
                    className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || idx === steps.length - 1 || step.isLocked}
                    onClick={() => onMoveStep(idx, 'down')}
                    aria-label={`Move Step ${idx + 1} Down`}
                    className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  {!step.isLocked && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemoveStep(step.id)}
                      aria-label={`Delete Step ${idx + 1}`}
                      className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Parameters */}
              <div className="p-3 space-y-2">
                {blockDef?.parameters.map((param) => {
                  const val = step.params?.[param.id] ?? param.defaultValue ?? '';

                  return (
                    <div key={param.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <label
                        htmlFor={`input-${step.id}-${param.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {param.label}
                        {param.required && <span className="text-destructive ml-0.5">*</span>}
                      </label>
                      <div className="md:col-span-2">
                        {param.type === 'enum' || param.type === 'role' ? (
                          <select
                            id={`input-${step.id}-${param.id}`}
                            value={val}
                            disabled={disabled || step.isLocked}
                            onChange={(e) => onUpdateStepParams(step.id, param.id, e.target.value)}
                            className="min-h-[38px] w-full text-xs rounded border border-border bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            {param.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`input-${step.id}-${param.id}`}
                            type={param.type === 'number' ? 'number' : 'text'}
                            value={val}
                            placeholder={param.placeholder}
                            disabled={disabled || step.isLocked}
                            onChange={(e) =>
                              onUpdateStepParams(
                                step.id,
                                param.id,
                                param.type === 'number' ? Number(e.target.value) : e.target.value,
                              )
                            }
                            className="min-h-[38px] w-full text-xs font-mono rounded border border-border bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {hasError && (
                  <div className="mt-2 text-xs text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{stepErrors[step.id]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
