import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownFragment } from '../features/lab/components/MarkdownFragment';

describe('MarkdownFragment Component Suite (Subtask 2.1)', () => {
  it('renders markdown heading, bold, and inline code without literal syntax markers', () => {
    const markdown = '### Title Here\nThis is **bold text** and `console.log(123)`.';
    const { container } = render(<MarkdownFragment content={markdown} />);

    // Should contain semantic heading
    const h4 = container.querySelector('h4');
    expect(h4).not.toBeNull();
    expect(h4?.textContent).toBe('Title Here');

    // Should contain strong tag, no literal **
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('bold text');
    expect(container.textContent).not.toContain('**bold text**');

    // Should contain code tag, no literal backticks
    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe('console.log(123)');
    expect(container.textContent).not.toContain('`console.log(123)`');
  });

  it('renders inlineOnly mode without wrapping in block paragraph tags', () => {
    const inlineContent = 'Option with `code` and **emphasis**';
    const { container } = render(<MarkdownFragment content={inlineContent} inlineOnly />);

    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('code');
    expect(container.querySelector('strong')?.textContent).toBe('emphasis');
  });

  it('strictly escapes raw HTML script tags to prevent DOM injection / XSS', () => {
    const malicious = '<script>window.__pwned = true;</script>Normal text';
    const { container } = render(<MarkdownFragment content={malicious} />);

    // script tag should NOT exist in DOM
    const scriptTag = container.querySelector('script');
    expect(scriptTag).toBeNull();

    // Raw text should be escaped in HTML
    expect(container.innerHTML).toContain('&lt;script&gt;');
    expect((window as any).__pwned).toBeUndefined();
  });

  it('sanitizes dangerous javascript: URLs in links', () => {
    const dangerousLink = '[Click me](javascript:alert("hacked"))';
    const { container } = render(<MarkdownFragment content={dangerousLink} />);

    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('#');
  });

  it('escapes quotes in URLs and titles to prevent attribute breakout XSS', () => {
    const maliciousHref = '[Click me](https://example.com "my-title" onclick="alert(1)")';
    const { container } = render(<MarkdownFragment content={maliciousHref} />);

    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    // href must NOT break out as an onclick attribute
    expect(anchor?.getAttribute('onclick')).toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
  });

  it('renders and sanitizes markdown images', () => {
    const safeImage = '![Diagram](https://example.com/tree.png "Binary Tree")';
    const { container: c1 } = render(<MarkdownFragment content={safeImage} />);
    const img1 = c1.querySelector('img');
    expect(img1).not.toBeNull();
    expect(img1?.getAttribute('src')).toBe('https://example.com/tree.png');
    expect(img1?.getAttribute('alt')).toBe('Diagram');
    expect(img1?.getAttribute('title')).toBe('Binary Tree');

    const unsafeImage = '![XSS](javascript:alert(1))';
    const { container: c2 } = render(<MarkdownFragment content={unsafeImage} />);
    const img2 = c2.querySelector('img');
    expect(img2).not.toBeNull();
    expect(img2?.getAttribute('src')).toBe('#');
  });

  it('renders markdown tables with styled container and borders', () => {
    const tableMarkdown = `
| Syntax | Description |
| :--- | :--- |
| Header | Title |
| Paragraph | Text |
`;
    const { container } = render(<MarkdownFragment content={tableMarkdown} />);
    const table = container.querySelector('table');
    expect(table).not.toBeNull();

    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toBe('Syntax');
    expect(headers[1].textContent).toBe('Description');

    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(4);
    expect(cells[0].textContent).toBe('Header');
    expect(cells[1].textContent).toBe('Title');
  });

  it('handles empty or malformed markdown gracefully', () => {
    const { container: c1 } = render(<MarkdownFragment content="" />);
    expect(c1.textContent).toBe('');

    const malformed = 'Unclosed **bold and `inline code with [broken link(';
    const { container: c2 } = render(<MarkdownFragment content={malformed} />);
    expect(c2.textContent).toBeTruthy();
  });
});
