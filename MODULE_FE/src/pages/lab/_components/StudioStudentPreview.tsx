import React from 'react';
import type { LabContentEnvelopeV1, SandboxType, PracticeLabV1 } from '../../../types/lab.types';
import { LabTheoryPane } from './LabTheoryPane';
import { Terminal, Database, HelpCircle, Code2 } from 'lucide-react';

export interface StudioStudentPreviewProps {
  envelope: LabContentEnvelopeV1;
  title: string;
  sandboxType: SandboxType;
}

export const StudioStudentPreview: React.FC<StudioStudentPreviewProps> = ({
  envelope,
  title,
  sandboxType,
}) => {
  // Construct a mock PracticeLabV1 to feed presentation components
  const mockLab: PracticeLabV1 = {
    id: 'studio-preview',
    seriesId: 'preview-series',
    slug: 'preview-slug',
    title: title || 'Untitled Lab',
    order: 1,
    isProOnly: false,
    sandboxType,
    envelope,
  };

  return (
    <div className="h-full flex flex-col md:flex-row border border-border rounded-lg overflow-hidden bg-background shadow-xs">
      {/* ── Left Pane: Theory & Instructions ───────────────────────────────── */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border h-full flex flex-col overflow-hidden">
        <LabTheoryPane
          lab={mockLab}
          hasSolutionAccess={false}
          onUpgradeClick={() => {}}
          className="w-full h-full flex flex-col bg-card overflow-hidden"
        />
      </div>

      {/* ── Right Pane: Sandbox Presentation Preview ───────────────────────── */}
      <div className="w-full md:w-1/2 h-full flex flex-col overflow-hidden bg-background">
        <div className="h-9 px-3 border-b border-border bg-muted/30 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Giao diện làm bài thực hành của học viên</span>
          <span className="text-[10px] text-muted-foreground">Mô phỏng Workspace</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sandboxType === 'js_worker' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-1.5 bg-muted/60 border-b border-border text-xs font-semibold flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-primary" />
                  <span>Student Code Editor (Initial Snippet)</span>
                </div>
                <pre className="p-3 bg-card font-mono text-xs overflow-x-auto text-foreground">
                  {envelope.initialSnippet || '// (No starter code provided)'}
                </pre>
              </div>

              {envelope.testScript && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-1.5 bg-muted/60 border-b border-border text-xs font-semibold flex items-center gap-1.5">
                    <Code2 className="size-3.5 text-emerald-500" />
                    <span>Injected Test Script</span>
                  </div>
                  <pre className="p-3 bg-muted/20 font-mono text-xs overflow-x-auto text-muted-foreground">
                    {envelope.testScript}
                  </pre>
                </div>
              )}
            </div>
          )}

          {sandboxType === 'sql_worker' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-1.5 bg-muted/60 border-b border-border text-xs font-semibold flex items-center gap-1.5">
                  <Database className="size-3.5 text-primary" />
                  <span>SQL Query Editor (Initial Snippet)</span>
                </div>
                <pre className="p-3 bg-card font-mono text-xs overflow-x-auto text-foreground">
                  {envelope.initialSnippet || '-- (No starter SQL provided)'}
                </pre>
              </div>

              {envelope.sandboxType === 'sql_worker' && envelope.config?.schemaSql && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-1.5 bg-muted/60 border-b border-border text-xs font-semibold flex items-center gap-1.5">
                    <Database className="size-3.5 text-purple-500" />
                    <span>In-Memory Schema DDL</span>
                  </div>
                  <pre className="p-3 bg-muted/20 font-mono text-xs overflow-x-auto text-muted-foreground">
                    {envelope.config.schemaSql}
                  </pre>
                </div>
              )}

              {envelope.sandboxType === 'sql_worker' &&
                envelope.config?.expectedQueryResult && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="px-3 py-1.5 bg-muted/60 border-b border-border text-xs font-semibold">
                      <span>Target Expected Query Output</span>
                    </div>
                    <pre className="p-3 bg-muted/20 font-mono text-xs overflow-x-auto text-emerald-600 dark:text-emerald-400">
                      {JSON.stringify(envelope.config.expectedQueryResult, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}

          {sandboxType === 'quizlet' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <HelpCircle className="size-4 text-primary" />
                <span>
                  Questions Preview (
                  {envelope.sandboxType === 'quizlet'
                    ? envelope.config?.questions?.length || 0
                    : 0}{' '}
                  questions)
                </span>
              </div>

              {envelope.sandboxType === 'quizlet' &&
                envelope.config?.questions?.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-lg border border-border bg-card space-y-2.5 shadow-2xs"
                  >
                    <span className="text-[11px] font-semibold text-primary uppercase">
                      Question {idx + 1}
                    </span>
                    <h4 className="text-xs font-medium text-foreground">{q.question}</h4>
                    <div className="space-y-1.5 pl-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex items-center gap-2 text-xs p-2 rounded border border-border/60 bg-background"
                        >
                          <span className="size-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
