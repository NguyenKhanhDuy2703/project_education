import React from 'react';
import type { SandboxType } from '../../../types/lab.types';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
  Info,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

export interface SmartLabToolbarProps {
  sandboxType?: SandboxType;
  onInsertSnippet: (snippet: string) => void;
  disabled?: boolean;
}

export const SmartLabToolbar: React.FC<SmartLabToolbarProps> = ({
  sandboxType = 'sql_worker',
  onInsertSnippet,
  disabled = false,
}) => {
  const codeLang = sandboxType === 'sql_worker' ? 'sql' : sandboxType === 'js_worker' ? 'javascript' : '';

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-muted/30 border-b border-border text-xs rounded-t-xl">
      {/* ── Group 1: Headings ── */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('# ')}
          className="h-7 px-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          title="Heading 1 (# )"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('## ')}
          className="h-7 px-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          title="Heading 2 (## )"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('### ')}
          className="h-7 px-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          title="Heading 3 (### )"
        >
          H3
        </Button>
      </div>

      {/* ── Group 2: Inline Styles ── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('**in đậm** ')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="In đậm (**text**)"
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('*in nghiêng* ')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="In nghiêng (*text*)"
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('~~gạch ngang~~ ')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Gạch ngang (~~text~~)"
        >
          <Strikethrough className="size-3.5" />
        </Button>
      </div>

      {/* ── Group 3: Code ── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('`mã_lệnh` ')}
          className="h-7 px-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
          title="Mã nội dòng (`code`)"
        >
          <Code className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet(`\n\`\`\`${codeLang}\n// Mã nguồn minh họa\n\`\`\`\n`)}
          className="h-7 px-2 text-xs gap-1 font-mono text-muted-foreground hover:text-foreground"
          title="Khối code (```code```)"
        >
          <FileCode className="size-3.5" />
          <span className="text-[11px]">Block</span>
        </Button>
      </div>

      {/* ── Group 4: Lists & Structure ── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n- Mục danh sách\n- Mục tiếp theo\n')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Danh sách gạch đầu dòng (- )"
        >
          <List className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n1. Bước 1\n2. Bước 2\n')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Danh sách đánh số (1. )"
        >
          <ListOrdered className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n- [ ] Nhiệm vụ 1\n- [ ] Nhiệm vụ 2\n')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Hộp kiểm nhiệm vụ (- [ ] )"
        >
          <CheckSquare className="size-3.5" />
        </Button>
      </div>

      {/* ── Group 5: Insert Blocks (Quote, Table, Link, Divider) ── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n> Trích dẫn hoặc định nghĩa quan trọng...\n')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Trích dẫn (> )"
        >
          <Quote className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() =>
            onInsertSnippet(
              '\n| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n| Dữ liệu A | Dữ liệu B | Dữ liệu C |\n'
            )
          }
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Chèn bảng mẫu"
        >
          <TableIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('[Tiêu đề liên kết](https://example.com)')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Chèn liên kết [link](url)"
        >
          <LinkIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n---\n')}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Đường kẻ phân cách (---)"
        >
          <Minus className="size-3.5" />
        </Button>
      </div>

      {/* ── Group 6: Callout Notes (Admonitions) ── */}
      <div className="flex items-center gap-1 pl-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n> [!NOTE]\n> Ghi chú quan trọng về khái niệm này...\n')}
          className="h-7 px-1.5 text-[11px] gap-1 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 font-medium"
          title="Ghi chú (> [!NOTE])"
        >
          <Info className="size-3" />
          <span>Note</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n> [!TIP]\n> Mẹo hay giúp tối ưu hóa truy vấn/mã lệnh...\n')}
          className="h-7 px-1.5 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
          title="Mẹo hay (> [!TIP])"
        >
          <Lightbulb className="size-3" />
          <span>Tip</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onInsertSnippet('\n> [!WARNING]\n> Lưu ý quan trọng tránh lỗi bảo mật hoặc hiệu năng...\n')}
          className="h-7 px-1.5 text-[11px] gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
          title="Cảnh báo (> [!WARNING])"
        >
          <AlertTriangle className="size-3" />
          <span>Warning</span>
        </Button>
      </div>
    </div>
  );
};
