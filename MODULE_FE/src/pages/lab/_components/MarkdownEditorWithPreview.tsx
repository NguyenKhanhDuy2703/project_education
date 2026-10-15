import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
  Code,
  FileCode,
  Heading2,
  Table as TableIcon,
  Link as LinkIcon,
  FileText,
  Maximize2,
  Minimize2,
  Eye,
  Edit3,
} from 'lucide-react';
import { renderMarkdown } from './renderMarkdown';

export interface MarkdownEditorWithPreviewProps {
  value: string;
  onChange: (val: string) => void;
  sandboxType?: string;
  minHeight?: string;
  placeholder?: string;
}

export function MarkdownEditorWithPreview({
  value,
  onChange,
  sandboxType = 'sql_worker',
  minHeight = '520px',
  placeholder = 'Soạn nội dung lý thuyết bằng Markdown...',
}: MarkdownEditorWithPreviewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSyncingScroll = useRef(false);

  // Debounce preview rendering to eliminate typing lag in editor
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 150);
    return () => clearTimeout(handler);
  }, [value]);

  const previewHtml = useMemo(() => {
    return renderMarkdown(debouncedValue);
  }, [debouncedValue]);

  // Sync scroll from textarea to preview
  const handleEditorScroll = () => {
    if (isSyncingScroll.current) return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    isSyncingScroll.current = true;
    const percentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  // Sync scroll from preview to textarea
  const handlePreviewScroll = () => {
    if (isSyncingScroll.current) return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    isSyncingScroll.current = true;
    const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
    textarea.scrollTop = percentage * (textarea.scrollHeight - textarea.clientHeight);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  // Markdown action insertion helper
  const insertFormatting = useCallback(
    (prefix: string, suffix: string = '', defaultText: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || defaultText;
      const replacement = `${prefix}${selectedText}${suffix}`;

      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      // Restore cursor position after state update
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      }, 0);
    },
    [value, onChange]
  );

  // Smart Templates by Sandbox Type
  const handleApplyTemplate = (type: string) => {
    let templateText = '';
    if (type === 'sql_worker') {
      templateText = `# Học về GROUP BY & Aggregate Functions

## 1. Lý thuyết cốt lõi
Mệnh đề \`GROUP BY\` trong SQL dùng để gom nhóm các dòng có cùng giá trị trên một hoặc nhiều cột. Lệnh này thường được sử dụng kết hợp với các hàm tổng hợp (\`Aggregate Functions\`) như:
- \`COUNT()\`: Đếm số lượng dòng trong mỗi nhóm.
- \`SUM()\`: Tính tổng giá trị số.
- \`AVG()\`: Tính giá trị trung bình.
- \`MIN() / MAX()\`: Tìm giá trị nhỏ nhất hoặc lớn nhất.

## 2. Cú pháp cơ bản
\`\`\`sql
SELECT column_name, COUNT(*) AS total_count, AVG(amount) AS avg_amount
FROM table_name
WHERE status = 'ACTIVE'
GROUP BY column_name
HAVING COUNT(*) > 1
ORDER BY total_count DESC;
\`\`\`

## 3. Yêu cầu bài thực hành
Thực hiện truy vấn theo lược đồ dữ liệu được cung cấp ở bước tiếp theo để trích xuất số liệu thống kê chính xác.`;
    } else if (type === 'quizlet') {
      templateText = `# Tổng quan về Database Indexing & Tối ưu Truy vấn

## 1. Lý thuyết tổng quan
Chỉ mục (Index) là cấu trúc dữ liệu giúp hệ quản trị cơ sở dữ liệu (RDBMS) tìm kiếm và truy xuất dòng dữ liệu nhanh hơn mà không cần quét toàn bộ bảng (\`Full Table Scan\`).

- **B-Tree Index**: Cấu trúc cây cân bằng, là loại chỉ mục mặc định của PostgreSQL và MySQL, tối ưu cho các phép so sánh bằng (\`=\`) và phạm vi (\`<\`, \`>\`, \`BETWEEN\`).
- **Hash Index**: Tối ưu riêng cho so sánh bằng tuyệt đối (\`=\`), không hỗ trợ tìm kiếm khoảng.
- **Chi phí đánh đổi**: Index giúp tăng tốc độ đọc (\`SELECT\`) nhưng làm chậm thao tác ghi (\`INSERT\`, \`UPDATE\`, \`DELETE\`) và tốn dung lượng lưu trữ đĩa.

## 2. Hướng dẫn làm bài
Hãy ôn kỹ các định nghĩa trên trước khi chuyển sang Bước 2 để hoàn thành các câu hỏi trắc nghiệm.`;
    } else {
      templateText = `# Thao tác Xử lý Mảng và Chuỗi trong JavaScript

## 1. Lý thuyết cốt lõi
Trong JavaScript hiện đại, các phương thức hàm bậc cao (\`Higher-Order Functions\`) giúp xử lý mảng dữ liệu gọn gàng và hạn chế lỗi:
- \`map()\`: Chuyển đổi từng phần tử thành phần tử mới.
- \`filter()\`: Lọc ra các phần tử thỏa mãn điều kiện.
- \`reduce()\`: Tích lũy các phần tử về một giá trị duy nhất.

## 2. Cú pháp mẫu
\`\`\`javascript
const activeUsers = users
  .filter((user) => user.isActive)
  .map((user) => user.name.trim().toUpperCase());
\`\`\`

## 3. Yêu cầu bài thực hành
Viết hàm giải pháp trong bài tập để xử lý dữ liệu đầu vào và vượt qua tất cả các test case kiểm thử.`;
    }

    if (value && value.trim().length > 20) {
      if (
        !window.confirm(
          'Áp dụng template mẫu sẽ thay thế nội dung markdown hiện tại. Bạn có chắc chắn muốn tiếp tục?'
        )
      ) {
        return;
      }
    }
    onChange(templateText);
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-card shadow-xs transition-all overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* ── Toolbar Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('**', '**', 'văn bản đậm')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Đậm (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('*', '*', 'văn bản nghiêng')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Nghiêng (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('`', '`', 'mã_inline')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Mã inline"
          >
            <Code className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              insertFormatting(
                '```' + (sandboxType === 'sql_worker' ? 'sql' : 'javascript') + '\n',
                '\n```',
                '-- Code tại đây'
              )
            }
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Khối code"
          >
            <FileCode className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('## ', '', 'Tiêu đề mục')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Tiêu đề H2"
          >
            <Heading2 className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              insertFormatting(
                '| Tiêu đề 1 | Tiêu đề 2 |\n|---|---|\n| Dữ liệu 1 | Dữ liệu 2 |\n',
                '',
                ''
              )
            }
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Bảng Markdown"
          >
            <TableIcon className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('[', '](https://example.com)', 'Liên kết')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Thêm liên kết"
          >
            <LinkIcon className="size-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Quick smart template injection */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleApplyTemplate(sandboxType)}
            className="h-7 text-[11px] font-semibold gap-1 px-2.5 text-primary border-primary/30 hover:bg-primary/5"
            title="Chèn nội dung mẫu chuẩn theo loại bài tập"
          >
            <FileText className="size-3" />
            <span>Mẫu {sandboxType === 'sql_worker' ? 'SQL' : sandboxType === 'quizlet' ? 'Quizlet' : 'JS'}</span>
          </Button>
        </div>

        {/* Right side toolbar tools */}
        <div className="flex items-center gap-2">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden">
            <Tabs
              value={activeMobileTab}
              onValueChange={(v) => setActiveMobileTab(v as 'edit' | 'preview')}
            >
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="edit" className="text-xs px-2.5 gap-1">
                  <Edit3 className="size-3" />
                  <span>Soạn</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-2.5 gap-1">
                  <Eye className="size-3" />
                  <span>Xem trước</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground">
            {value.length} ký tự
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── Editor Body: 50/50 Split View on lg+, Tabbed on Mobile ───────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border flex-1"
        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
      >
        {/* Left Side: Markdown Source Editor */}
        <div
          className={`flex flex-col bg-background ${
            activeMobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-3.5 py-1.5 border-b border-border/50 bg-muted/10 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>SOẠN THẢO MARKDOWN</span>
            <span className="text-[10px] font-mono">GFM Syntax</span>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleEditorScroll}
            placeholder={placeholder}
            className="flex-1 w-full p-4 font-mono text-xs sm:text-sm text-foreground bg-transparent resize-none focus:outline-none leading-relaxed overflow-y-auto"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
          />
        </div>

        {/* Right Side: Live HTML Preview with Synchronized Scroll */}
        <div
          className={`flex flex-col bg-card/40 ${
            activeMobileTab === 'edit' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-3.5 py-1.5 border-b border-border/50 bg-muted/10 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>XEM TRƯỚC THỰC TẾ (LIVE PREVIEW)</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Cuộn đồng bộ</span>
          </div>
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            className="flex-1 p-5 overflow-y-auto prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 170px)' : minHeight }}
            dangerouslySetInnerHTML={{
              __html:
                previewHtml ||
                '<p class="text-xs text-muted-foreground italic">Chưa có nội dung xem trước. Hãy nhập markdown ở cột bên trái...</p>',
            }}
          />
        </div>
      </div>
    </div>
  );
}
