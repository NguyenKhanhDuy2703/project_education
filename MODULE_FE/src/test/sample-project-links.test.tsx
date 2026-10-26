import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SampleProjectLinks, isValidHttpUrl } from '@/components/domain/SampleProjectLinks';

describe('PB-08: Sample Project Links Component & Security', () => {
  it('validates HTTP and HTTPS URLs correctly', () => {
    expect(isValidHttpUrl('https://github.com/studyweb/sample-repo')).toBe(true);
    expect(isValidHttpUrl('http://api.studyweb.dev/swagger')).toBe(true);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidHttpUrl('not-a-valid-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(undefined)).toBe(false);
  });

  it('renders nothing when no valid URLs are provided and showEmptyState is false', () => {
    const { container } = render(<SampleProjectLinks repoUrl={null} swaggerUrl="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state message when showEmptyState is true and no valid URLs exist', () => {
    render(<SampleProjectLinks repoUrl={null} swaggerUrl="" showEmptyState />);
    expect(screen.getByTestId('sample-links-empty')).toBeDefined();
    expect(screen.getByText(/No sample repository or documentation configured/i)).toBeDefined();
  });

  it('renders valid GitHub and Swagger links with security attributes (target=_blank, rel=noopener noreferrer)', () => {
    render(
      <SampleProjectLinks
        repoUrl="https://github.com/studyweb/sample-project"
        swaggerUrl="https://petstore.swagger.io/v2/swagger.json"
      />
    );

    const repoLink = screen.getByRole('link', { name: /Open Sample GitHub Repository/i });
    expect(repoLink).toBeDefined();
    expect(repoLink.getAttribute('href')).toBe('https://github.com/studyweb/sample-project');
    expect(repoLink.getAttribute('target')).toBe('_blank');
    expect(repoLink.getAttribute('rel')).toBe('noopener noreferrer');

    const swaggerLink = screen.getByRole('link', { name: /Open Swagger API Documentation/i });
    expect(swaggerLink).toBeDefined();
    expect(swaggerLink.getAttribute('href')).toBe('https://petstore.swagger.io/v2/swagger.json');
    expect(swaggerLink.getAttribute('target')).toBe('_blank');
    expect(swaggerLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('does not render malicious javascript: URL even if provided', () => {
    render(
      <SampleProjectLinks
        repoUrl="javascript:stealToken()"
        swaggerUrl="https://petstore.swagger.io/v2/swagger.json"
      />
    );

    expect(screen.queryByRole('link', { name: /Open Sample GitHub Repository/i })).toBeNull();
    const swaggerLink = screen.getByRole('link', { name: /Open Swagger API Documentation/i });
    expect(swaggerLink).toBeDefined();
  });
});
