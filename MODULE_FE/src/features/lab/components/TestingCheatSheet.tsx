import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export interface CheatSheetEntry {
  matcher: string;
  description: string;
  example: string;
}

const DEFAULT_MATCHERS: CheatSheetEntry[] = [
  {
    matcher: 'expect(a).toBe(b)',
    description: 'Kiểm tra so sánh bằng tuyệt đối kiểu nguyên thủy (Strict Primitive Equality - Object.is).',
    example: 'expect(response.status).toBe(200);',
  },
  {
    matcher: 'expect(a).toEqual(b)',
    description: 'So sánh sâu cấu trúc và giá trị của Object hoặc Array (Deep Equality).',
    example: 'expect(response.data).toEqual({ id: 1, active: true });',
  },
  {
    matcher: 'expect(a).toBeDefined()',
    description: 'Xác thực trường dữ liệu tồn tại và không phải là undefined.',
    example: 'expect(response.data.accessToken).toBeDefined();',
  },
  {
    matcher: 'expect(a).toContain(item)',
    description: 'Kiểm tra chuỗi chứa chuỗi con, mảng chứa phần tử, hoặc đối tượng có thuộc tính chỉ định.',
    example: 'expect(response.headers["content-type"]).toContain("application/json");',
  },
  {
    matcher: 'expect(a).not.[matcher]',
    description: 'Phủ định kết quả của bất kỳ matcher nào.',
    example: 'expect(response.status).not.toBe(404);',
  },
];

export interface TestingCheatSheetProps {
  entries?: CheatSheetEntry[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function TestingCheatSheet({
  entries = DEFAULT_MATCHERS,
  collapsible = true,
  defaultExpanded = true,
}: TestingCheatSheetProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-xs">
      <div
        onClick={() => collapsible && setExpanded((p) => !p)}
        className="px-3.5 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">API Automation Testing CheatSheet</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
            v1.0
          </Badge>
        </div>
        {collapsible && (
          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        )}
      </div>

      {expanded && (
        <div className="p-3 space-y-2.5">
          {entries.map((item, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-border/70 bg-background/50 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                    {item.matcher}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item.example, idx)}
                    className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    title="Copy example code"
                  >
                    {isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{item.description}</p>
                <div className="pt-0.5">
                  <pre className="font-mono text-[11px] text-foreground bg-muted/40 p-1.5 rounded border border-border/40 overflow-x-auto">
                    <code>{item.example}</code>
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
