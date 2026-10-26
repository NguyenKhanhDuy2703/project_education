import { Marked } from 'marked';

const markedInstance = new Marked({
  gfm: true,
  breaks: false,
});

markedInstance.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const rawText = tokens.map((t: any) => t.raw || t.text || '').join('');
      const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const idAttr = id ? ` id="${id}"` : '';
      if (depth === 1) {
        return `<h1${idAttr} class="text-xl font-bold text-foreground mt-4 mb-2 tracking-tight">${text}</h1>`;
      }
      if (depth === 2) {
        return `<h2${idAttr} class="text-lg font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border tracking-tight">${text}</h2>`;
      }
      if (depth === 3) {
        return `<h3${idAttr} class="text-base font-semibold text-foreground mt-3 mb-1.5">${text}</h3>`;
      }
      return `<h4${idAttr} class="text-sm font-semibold text-foreground mt-2 mb-1">${text}</h4>`;
    },
    table(token) {
      const header = token.header
        .map((cell) => {
          const content = this.parser.parseInline(cell.tokens);
          const align = cell.align ? ` text-${cell.align}` : ' text-left';
          return `<th class="px-3.5 py-2.5 font-semibold text-xs tracking-wider border-b border-border text-foreground bg-muted/60${align}">${content}</th>`;
        })
        .join('');

      const body = token.rows
        .map((row) => {
          const cells = row
            .map((cell) => {
              const content = this.parser.parseInline(cell.tokens);
              const align = cell.align ? ` text-${cell.align}` : ' text-left';
              return `<td class="px-3.5 py-2.5 text-xs text-foreground/90 border-b border-border/50${align}">${content}</td>`;
            })
            .join('');
          return `<tr class="hover:bg-muted/30 transition-colors">${cells}</tr>`;
        })
        .join('');

      return `
        <div class="my-4 w-full overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
          <table class="w-full text-left border-collapse">
            <thead><tr>${header}</tr></thead>
            <tbody class="divide-y divide-border/40">${body}</tbody>
          </table>
        </div>
      `;
    },
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p class="my-2 text-sm leading-relaxed text-foreground/90">${text}</p>`;
    },
    list(token) {
      const tag = token.ordered ? 'ol' : 'ul';
      const listClass = token.ordered
        ? 'my-2.5 ml-5 list-decimal space-y-1 text-sm text-foreground/90'
        : 'my-2.5 ml-5 list-disc space-y-1 text-sm text-foreground/90';
      const body = token.items.map((item) => this.listitem(item)).join('');
      return `<${tag} class="${listClass}">${body}</${tag}>`;
    },
    listitem(item) {
      const text = this.parser.parse(item.tokens, !!item.loose);
      return `<li class="leading-relaxed">${text}</li>`;
    },
    code({ text, lang }) {
      const langBadge = lang
        ? `<div class="px-3 py-1 bg-muted/90 border-b border-border text-[11px] font-mono text-muted-foreground uppercase font-bold tracking-wider">${lang}</div>`
        : '';
      return `
        <div class="my-3 overflow-hidden rounded-lg border border-border bg-muted/40 shadow-xs">
          ${langBadge}
          <pre class="p-3.5 overflow-x-auto font-mono text-xs text-foreground leading-relaxed"><code>${text}</code></pre>
        </div>
      `;
    },
    codespan({ text }) {
      return `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-medium border border-border/40">${text}</code>`;
    },
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `
        <blockquote class="my-3 border-l-4 border-primary/70 bg-muted/30 px-3.5 py-2.5 rounded-r-md text-sm italic text-muted-foreground">
          ${body}
        </blockquote>
      `;
    },
    hr() {
      return `<hr class="my-4 border-border" />`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" class="font-medium text-primary underline underline-offset-4 hover:opacity-80">${text}</a>`;
    },
  },
});

const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'div', 'blockquote', 'pre', 'code', 'hr', 'br',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'img', 'strong', 'em', 'del', 's', 'sub', 'sup', 'b', 'i', 'u',
]);

const ALLOWED_ATTRS = new Set([
  'id', 'class', 'classname', 'align', 'title', 'alt', 'src', 'href', 'target', 'rel',
]);

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === 3) return; // Node.TEXT_NODE
    if (node.nodeType === 8) { // Node.COMMENT_NODE
      node.parentNode?.removeChild(node);
      return;
    }
    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        el.parentNode?.removeChild(el);
        return;
      }

      const attrNames = Array.from(el.attributes).map((a) => a.name);
      for (const name of attrNames) {
        const lowerName = name.toLowerCase();
        if (lowerName.startsWith('on') || !ALLOWED_ATTRS.has(lowerName)) {
          el.removeAttribute(name);
          continue;
        }
        if (lowerName === 'href' || lowerName === 'src') {
          const val = el.getAttribute(name)?.trim() || '';
          if (/^(?:javascript|vbscript|data):/i.test(val)) {
            el.removeAttribute(name);
          }
        }
      }

      if (tagName === 'a') {
        const target = el.getAttribute('target');
        if (target === '_blank') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }

      const children = Array.from(el.childNodes);
      for (const child of children) {
        sanitizeNode(child);
      }
    }
  };

  const bodyChildren = Array.from(doc.body.childNodes);
  for (const child of bodyChildren) {
    sanitizeNode(child);
  }

  return doc.body.innerHTML;
}

export function renderMarkdown(md: string): string {
  if (!md) return '';
  try {
    const rawParsed = markedInstance.parse(md) as string;
    return sanitizeHtml(rawParsed);
  } catch (err) {
    console.error('Failed to parse markdown:', err);
    return sanitizeHtml(md);
  }
}

