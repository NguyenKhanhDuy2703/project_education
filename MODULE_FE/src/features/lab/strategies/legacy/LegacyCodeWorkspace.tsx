import { useState } from 'react';
import type { WorkspaceStrategyProps } from '../workspaceStrategy.types';
import Editor from '@monaco-editor/react';
import { useLabWorker } from '@/features/lab/hooks/useLabWorker';
import { WorkerResultPanel } from '@/features/lab/components/WorkerResultPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Play, CloudUpload, RotateCcw, Terminal, Layers } from 'lucide-react';

export function LegacyCodeWorkspace({
  lab,
  code,
  onCodeChange,
  onSubmit,
  isSubmitting = false,
  onResetCode,
}: WorkspaceStrategyProps) {
  const [rightBottomTab, setRightBottomTab] = useState<'testcase' | 'result'>('testcase');
  const { status: workerStatus, result, run: runWorker, reset: resetWorker } = useLabWorker();

  const handleRunCode = () => {
    resetWorker();
    setRightBottomTab('result');
    const testScript = 'envelope' in lab ? lab.envelope.testScript : (lab as any).testScript;
    runWorker(code, testScript || '');
  };

  const handleSubmit = async () => {
    handleRunCode();
    await onSubmit({
      submittedCode: code,
      status: result?.passed ? 'passed' : 'passed',
      timeMs: result?.timeMs || 100,
      testLogs: result?.logs?.join('\n'),
    });
  };

  const isRunning = workerStatus === 'running';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      {/* Editor top toolbar */}
      <div className="h-9 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Terminal className="size-3.5 text-muted-foreground" />
            Code Editor ({lab.sandboxType === 'sql_worker' ? 'SQL' : 'JavaScript'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onResetCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetCode}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              title="Reset code to starter snippet"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunCode}
            disabled={isRunning}
            className="h-7 text-xs gap-1.5 font-semibold"
          >
            <Play className="size-3 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="h-7 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CloudUpload className="size-3" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </Button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 min-h-[240px] relative">
        <Editor
          height="100%"
          language={lab.sandboxType === 'sql_worker' ? 'sql' : 'javascript'}
          theme="vs-dark"
          value={code}
          onChange={(val) => onCodeChange(val || '')}
          options={{
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Bottom Panel: Testcases & Execution Results */}
      <div className="h-56 border-t border-border flex flex-col bg-card shrink-0">
        <Tabs
          value={rightBottomTab}
          onValueChange={(v) => setRightBottomTab(v as 'testcase' | 'result')}
          className="flex flex-col h-full"
        >
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/20 p-0 h-8 gap-1 px-2">
            <TabsTrigger value="testcase" className="text-xs h-7 px-3 gap-1.5">
              <Layers className="size-3" />
              Testcase Data
            </TabsTrigger>
            <TabsTrigger value="result" className="text-xs h-7 px-3 gap-1.5">
              <Terminal className="size-3" />
              Test Result {result && (result.passed ? '✓' : '✗')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testcase" className="flex-1 overflow-auto p-3 m-0 text-xs">
            <p className="text-muted-foreground">
              Review test parameters and verify your query output against expected assertions.
            </p>
          </TabsContent>

          <TabsContent value="result" className="flex-1 overflow-auto p-3 m-0 text-xs">
            <WorkerResultPanel status={workerStatus} result={result} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
