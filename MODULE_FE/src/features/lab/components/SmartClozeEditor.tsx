import { useState, useId } from 'react';
import type { BlankDefinition, TemplateSegment } from '@/types/lab.types';
import { ChevronDown, ChevronRight, AlertCircle, Info, Lock } from 'lucide-react';

interface SmartClozeEditorProps {
  template: TemplateSegment[];
  blanks: BlankDefinition[];
  answers: Record<string, any>;
  onAnswerChange: (blankId: string, value: any) => void;
  validationErrors?: Record<string, string>;
  activeBlankId?: string | null;
  onSelectBlank?: (blankId: string) => void;
  onResetBlank?: (blankId: string) => void;
  disabled?: boolean;
}

function coerceAnswerValue(blank: BlankDefinition, rawVal: any): any {
  if (blank.kind === 'http_status' || blank.valueType === 'number') {
    if (rawVal === '' || rawVal === undefined || rawVal === null) return '';
    const num = Number(rawVal);
    return Number.isNaN(num) ? rawVal : num;
  }
  if (blank.valueType === 'boolean') {
    if (rawVal === 'true' || rawVal === true) return true;
    if (rawVal === 'false' || rawVal === false) return false;
    return rawVal;
  }
  return rawVal;
}

interface FormattedLineToken {
  type: 'text' | 'blank';
  text?: string;
  blank?: BlankDefinition;
}

export function SmartClozeEditor({
  template,
  blanks,
  answers,
  onAnswerChange,
  validationErrors = {},
  activeBlankId,
  onSelectBlank,
  onResetBlank,
  disabled = false,
}: SmartClozeEditorProps) {
  const [expandedManaged, setExpandedManaged] = useState<Record<number, boolean>>({});
  const baseId = useId();

  const blanksMap = new Map<string, BlankDefinition>();
  for (const b of blanks) {
    blanksMap.set(b.id, b);
  }

  const toggleManaged = (idx: number) => {
    setExpandedManaged((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Segment parser: splits template into lines while preserving blanks and managed folds
  const renderTemplateContent = () => {
    // Collect lines and managed blocks
    type LineItem =
      | { type: 'managed'; segment: TemplateSegment & { kind: 'managed' }; index: number }
      | { type: 'code_line'; tokens: FormattedLineToken[] };

    const items: LineItem[] = [];
    let currentTokens: FormattedLineToken[] = [];

    const flushCurrentLine = () => {
      items.push({ type: 'code_line', tokens: currentTokens });
      currentTokens = [];
    };

    template.forEach((segment, idx) => {
      if (segment.kind === 'managed') {
        if (currentTokens.length > 0) {
          flushCurrentLine();
        }
        items.push({ type: 'managed', segment, index: idx });
      } else if (segment.kind === 'readonly') {
        const parts = segment.text.split('\n');
        parts.forEach((part, partIdx) => {
          if (partIdx > 0) {
            flushCurrentLine();
          }
          if (part.length > 0) {
            currentTokens.push({ type: 'text', text: part });
          }
        });
      } else if (segment.kind === 'blank') {
        const def = blanksMap.get(segment.blankId);
        if (def) {
          currentTokens.push({ type: 'blank', blank: def });
        }
      }
    });

    if (currentTokens.length > 0) {
      flushCurrentLine();
    }

    return items;
  };

  const lineItems = renderTemplateContent();
  let codeLineCounter = 0;

  return (
    <div
      className="flex-1 flex flex-col font-mono text-xs overflow-auto bg-[#1e1e1e] text-[#d4d4d4] select-none p-4"
      role="region"
      aria-label="Smart Cloze Test Code Editor"
    >
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Lock className="size-3 text-amber-400" />
          <span>Smart Cloaked Code · Scaffolded test assertion editor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-white/5">
            Tab key jumps between blanks
          </span>
        </div>
      </div>

      <div className="space-y-1 font-mono">
        {lineItems.map((item, itemIdx) => {
          if (item.type === 'managed') {
            const isExpanded = Boolean(expandedManaged[item.index]);
            return (
              <div
                key={`managed-${item.index}`}
                className="my-1.5 rounded border border-dashed border-zinc-700 bg-zinc-900/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleManaged(item.index)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="size-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="size-3.5 text-zinc-400" />
                    )}
                    <span className="font-semibold text-zinc-300">
                      ▸ {item.segment.label || 'Framework & Test Setup'}
                    </span>
                    {item.segment.summary && (
                      <span className="text-zinc-500 text-[11px]">({item.segment.summary})</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {isExpanded ? 'Hide context' : 'Managed fold'}
                  </span>
                </button>

                {isExpanded && item.segment.code && (
                  <div className="p-3 bg-black/40 border-t border-zinc-800 text-zinc-400 text-[11px] whitespace-pre-wrap select-text font-mono">
                    {item.segment.code}
                  </div>
                )}
              </div>
            );
          }

          // Code line with tokens — sequence correctly from 1
          codeLineCounter += 1;
          const currentLineNum = codeLineCounter;

          return (
            <div key={`line-${itemIdx}`} className="flex items-center min-h-[26px] leading-relaxed group">
              <span className="w-8 shrink-0 text-right pr-3 text-zinc-600 select-none text-[11px]">
                {currentLineNum}
              </span>

              <div className="flex-1 flex flex-wrap items-center gap-x-1 select-text">
                {item.tokens.map((token, tokIdx) => {
                  if (token.type === 'text') {
                    return (
                      <span key={`text-${tokIdx}`} className="whitespace-pre text-zinc-300">
                        {token.text}
                      </span>
                    );
                  }

                  if (!token.blank) return null;
                  const blank = token.blank;
                  const value = answers[blank.id] !== undefined ? answers[blank.id] : blank.defaultValue ?? '';
                  const error = validationErrors[blank.id];
                  const isActive = activeBlankId === blank.id;
                  const inputId = `${baseId}-blank-${blank.id}-${itemIdx}-${tokIdx}`;

                  return (
                    <div
                      key={`blank-${blank.id}-${itemIdx}-${tokIdx}`}
                      className="inline-flex items-center relative my-0.5 mx-0.5"
                    >
                      {blank.options && blank.options.length > 0 ? (
                        <select
                          id={inputId}
                          value={String(value)}
                          disabled={disabled}
                          onChange={(e) => onAnswerChange(blank.id, coerceAnswerValue(blank, e.target.value))}
                          onFocus={() => onSelectBlank?.(blank.id)}
                          aria-label={blank.label || blank.id}
                          aria-invalid={Boolean(error)}
                          className={`h-6 text-xs px-2 py-0.5 rounded font-mono font-semibold border transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                            error
                              ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-500/30'
                              : isActive
                                ? 'border-primary bg-primary/20 text-primary-foreground ring-2 ring-primary/40'
                                : 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:border-amber-400'
                          }`}
                        >
                          {blank.options.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)} className="bg-zinc-900 text-zinc-100">
                              {opt.label || String(opt.value)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={inputId}
                          type={blank.valueType === 'number' ? 'number' : 'text'}
                          value={value}
                          disabled={disabled}
                          placeholder={blank.placeholder || blank.label}
                          onChange={(e) => onAnswerChange(blank.id, coerceAnswerValue(blank, e.target.value))}
                          onFocus={() => onSelectBlank?.(blank.id)}
                          aria-label={blank.label || blank.id}
                          aria-invalid={Boolean(error)}
                          className={`h-6 text-xs px-2 py-0.5 rounded font-mono font-semibold border transition-all min-w-[90px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                            error
                              ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-500/30'
                              : isActive
                                ? 'border-primary bg-primary/20 text-white ring-2 ring-primary/40'
                                : 'border-amber-500/60 bg-amber-500/10 text-amber-200 placeholder:text-amber-500/50 hover:border-amber-400'
                          }`}
                        />
                      )}

                      {error && (
                        <span
                          className="ml-1 text-rose-400"
                          title={error}
                          aria-label={`Error on ${blank.label}: ${error}`}
                        >
                          <AlertCircle className="size-3" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active blank helper tooltip / status bar */}
      {activeBlankId && (
        <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          {(() => {
            const activeBlank = blanksMap.get(activeBlankId);
            if (!activeBlank) return null;
            const error = validationErrors[activeBlankId];
            return (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="size-3.5 text-primary" />
                  <span>
                    <strong>{activeBlank.label}</strong>
                    {activeBlank.helperText && ` — ${activeBlank.helperText}`}
                  </span>
                  {error && <span className="text-rose-400 font-semibold font-mono">({error})</span>}
                </div>
                {onResetBlank && (
                  <button
                    type="button"
                    onClick={() => onResetBlank(activeBlank.id)}
                    className="text-[10px] text-zinc-400 hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Reset this blank
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
