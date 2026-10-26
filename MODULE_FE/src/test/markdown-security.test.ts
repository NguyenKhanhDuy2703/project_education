import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/pages/lab/_components/renderMarkdown';

describe('Markdown Security Prevention Suite (PB-18)', () => {
  it('strips <script> tags completely from rendered output', () => {
    const rawInput = 'Hello <script>alert("XSS")</script> World';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('<script');
    expect(output).not.toContain('alert("XSS")');
    expect(output).toContain('Hello');
    expect(output).toContain('World');
  });

  it('strips onerror and event handler attributes', () => {
    const rawInput = '<img src="valid.png" onerror="alert(1)" alt="Image" />';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('alert(1)');
    expect(output).toContain('<img');
    expect(output).toContain('src="valid.png"');
  });

  it('strips javascript: and vbscript: URLs from hyperlinks', () => {
    const rawInput = '[Click Me](javascript:stealCookie())';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('stealCookie');
  });

  it('preserves valid markdown formatting, tables, and code blocks', () => {
    const rawInput = `
# Title

A paragraph with **bold** and *italic* and \`inline code\`.

| Name | Role |
| --- | --- |
| Alice | Admin |

\`\`\`typescript
const greeting = "Hello World";
\`\`\`
    `.trim();

    const output = renderMarkdown(rawInput);
    expect(output).toContain('<h1');
    expect(output).toContain('Title</h1>');
    expect(output).toContain('<strong>bold</strong>');
    expect(output).toContain('<code>const greeting = "Hello World";</code>');
    expect(output).toContain('<table');
    expect(output).toContain('Alice');
  });
});
