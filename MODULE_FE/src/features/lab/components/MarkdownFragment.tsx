import React, { useMemo } from 'react';
import { Marked } from 'marked';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeHref(url?: string): string {
  if (!url) return '#';
  // Strip control characters and whitespace
  const cleaned = url.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '');
  const lower = cleaned.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '#';
  }
  // Allow safe web protocols or relative/anchor links
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('/') ||
    lower.startsWith('#') ||
    lower.startsWith('./') ||
    lower.startsWith('../')
  ) {
    return cleaned;
  }
  return '#';
}

// Dedicated marked instance with strict security escaping
const safeMarked = new Marked({
  gfm: true,
  breaks: true,
});

safeMarked.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      if (depth <= 3) {
        return `<h4 class="text-sm font-bold text-foreground mt-2 mb-1 tracking-tight">${text}</h4>`;
      }
      return `<h5 class="text-xs font-bold text-foreground mt-1.5 mb-1">${text}</h5>`;
    },
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p class="my-1 text-sm leading-relaxed text-foreground">${text}</p>`;
    },
    codespan({ text }) {
      return `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-semibold border border-border/50">${escapeHtml(
        text
      )}</code>`;
    },
    code({ text, lang }) {
      const langBadge = lang
        ? `<div class="px-2.5 py-0.5 bg-muted/80 border-b border-border text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">${escapeHtml(
            lang
          )}</div>`
        : '';
      return `
        <div class="my-2 overflow-hidden rounded-md border border-border bg-muted/30 shadow-2xs">
          ${langBadge}
          <pre class="p-3 overflow-x-auto font-mono text-xs text-foreground leading-relaxed"><code>${escapeHtml(
            text
          )}</code></pre>
        </div>
      `;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const safeUrl = sanitizeHref(href);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(safeUrl)}"${titleAttr} target="_blank" rel="noopener noreferrer" class="font-medium text-primary underline underline-offset-2 hover:opacity-80">${text}</a>`;
    },
    image({ href, title, text }) {
      const safeUrl = sanitizeHref(href);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const altAttr = text ? ` alt="${escapeHtml(text)}"` : '';
      return `<img src="${escapeHtml(safeUrl)}"${altAttr}${titleAttr} class="max-w-full h-auto rounded my-2 border border-border" loading="lazy" />`;
    },
    table(token) {
      const headerCells = token.header
        .map((cell) => {
          const content = this.parser.parseInline(cell.tokens);
          return `<th class="px-3 py-2 bg-muted/60 font-semibold border-b border-border text-foreground text-left">${content}</th>`;
        })
        .join('');
      const headerRow = `<tr>${headerCells}</tr>`;

      const bodyRows = token.rows
        .map((row) => {
          const cells = row
            .map((cell) => {
              const content = this.parser.parseInline(cell.tokens);
              return `<td class="px-3 py-2 border-b border-border/40 text-foreground">${content}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `<div class="my-2.5 overflow-x-auto rounded border border-border">
        <table class="w-full text-xs text-left border-collapse">
          <thead>${headerRow}</thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
    },
    list(token) {
      const tag = token.ordered ? 'ol' : 'ul';
      const listClass = token.ordered
        ? 'my-1.5 ml-4 list-decimal space-y-0.5 text-xs text-foreground'
        : 'my-1.5 ml-4 list-disc space-y-0.5 text-xs text-foreground';
      const body = token.items.map((item) => this.listitem(item)).join('');
      return `<${tag} class="${listClass}">${body}</${tag}>`;
    },
    listitem(item) {
      const text = this.parser.parse(item.tokens, !!item.loose);
      return `<li class="leading-relaxed">${text}</li>`;
    },
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote class="my-2 border-l-2 border-primary/60 bg-muted/20 px-3 py-1.5 rounded-r text-xs italic text-muted-foreground">${body}</blockquote>`;
    },
    strong({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<strong class="font-semibold text-foreground">${text}</strong>`;
    },
    em({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<em class="italic text-foreground">${text}</em>`;
    },
  },
});

export interface MarkdownFragmentProps {
  content: string;
  inlineOnly?: boolean;
  className?: string;
}

export const MarkdownFragment: React.FC<MarkdownFragmentProps> = ({
  content,
  inlineOnly = false,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';
    try {
      if (inlineOnly) {
        // Strip block syntax and parse inline tokens
        const inlineParsed = safeMarked.parseInline(content) as string;
        return inlineParsed;
      }
      return safeMarked.parse(content) as string;
    } catch {
      return escapeHtml(content);
    }
  }, [content, inlineOnly]);

  return (
    <div
      className={`markdown-fragment break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
