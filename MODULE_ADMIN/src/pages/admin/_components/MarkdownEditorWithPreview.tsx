import { useState, useRef, useCallback } from 'react';
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
import { renderMarkdown } from '../_utils/renderMarkdown';

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
  placeholder = 'Draft theoretical content in Markdown...',
}: MarkdownEditorWithPreviewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSyncingScroll = useRef(false);

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
      templateText = `# Understanding GROUP BY & Aggregate Functions

## 1. Core Theory
The \`GROUP BY\` clause in SQL groups rows with matching values across one or more columns into summary rows. It is commonly used with aggregate functions such as:
- \`COUNT()\`: Counts the number of rows in each group.
- \`SUM()\`: Calculates the total sum of numeric values.
- \`AVG()\`: Calculates the average value.
- \`MIN() / MAX()\`: Finds the minimum or maximum value.

## 2. Basic Syntax
\`\`\`sql
SELECT column_name, COUNT(*) AS total_count, AVG(amount) AS avg_amount
FROM table_name
WHERE status = 'ACTIVE'
GROUP BY column_name
HAVING COUNT(*) > 1
ORDER BY total_count DESC;
\`\`\`

## 3. Practice Requirements
Execute the query against the schema provided in the next step to extract the required statistical metrics accurately.`;
    } else if (type === 'quizlet') {
      templateText = `# Database Indexing & Query Optimization Overview

## 1. Theoretical Overview
An Index is a data structure that enables the Database Management System (RDBMS) to locate and retrieve rows faster without performing a full table scan (\`Full Table Scan\`).

- **B-Tree Index**: Balanced tree structure, default index type in PostgreSQL and MySQL, optimal for equality (\`=\`) and range (\`<\`, \`>\`, \`BETWEEN\`) queries.
- **Hash Index**: Optimized for exact equality matches (\`=\`), does not support range queries.
- **Trade-offs**: Indexes accelerate read queries (\`SELECT\`) at the expense of write operations (\`INSERT\`, \`UPDATE\`, \`DELETE\`) and additional disk storage.

## 2. Quiz Guidelines
Review the theoretical concepts above thoroughly before proceeding to Step 2 to complete the quiz questions.`;
    } else {
      templateText = `# Array & String Manipulation in JavaScript

## 1. Core Theory
In modern JavaScript, higher-order functions allow concise and declarative data transformations:
- \`map()\`: Transforms each element into a new representation.
- \`filter()\`: Selects elements matching a given predicate condition.
- \`reduce()\`: Accumulates array elements into a single aggregate value.

## 2. Code Example
\`\`\`javascript
const activeUsers = users
  .filter((user) => user.isActive)
  .map((user) => user.name.trim().toUpperCase());
\`\`\`

## 3. Practice Requirements
Implement the solution function to process input datasets and satisfy all unit test assertions.`;
    }

    if (value && value.trim().length > 20) {
      if (
        !window.confirm(
          'Applying this template will replace the current markdown content. Are you sure you want to continue?'
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
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('`', '`', 'inline_code')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Inline code"
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
                '// Code here'
              )
            }
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Code block"
          >
            <FileCode className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('## ', '', 'Section Heading')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Heading 2"
          >
            <Heading2 className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              insertFormatting(
                '| Column 1 | Column 2 |\n|---|---|\n| Data 1 | Data 2 |\n',
                '',
                ''
              )
            }
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Markdown Table"
          >
            <TableIcon className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('[', '](https://example.com)', 'Link')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Insert Link"
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
            title="Insert standard exercise template"
          >
            <FileText className="size-3" />
            <span>Template {sandboxType === 'sql_worker' ? 'SQL' : sandboxType === 'quizlet' ? 'Quizlet' : 'JS'}</span>
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
                  <span>Edit</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-2.5 gap-1">
                  <Eye className="size-3" />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground">
            {value.length} characters
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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
            <span>MARKDOWN EDITOR</span>
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
            <span>LIVE PREVIEW</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Sync Scroll</span>
          </div>
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            className="flex-1 p-5 overflow-y-auto prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 170px)' : minHeight }}
            dangerouslySetInnerHTML={{
              __html:
                renderMarkdown(value) ||
                '<p class="text-xs text-muted-foreground italic">No preview content yet. Enter markdown in the editor on the left...</p>',
            }}
          />
        </div>
      </div>
    </div>
  );
}
