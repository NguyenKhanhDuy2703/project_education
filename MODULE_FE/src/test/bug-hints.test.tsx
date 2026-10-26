import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BugHintsPanel, normalizeBugHints } from '@/pages/lab/_components/BugHintsPanel';

describe('PB-10: Categorized Bug Hints Component & A11y', () => {
  it('normalizes string array and object hints into categorized tiers', () => {
    const raw = [
      'Check database foreign key constraint',
      { id: 'h1', severity: 'critical', title: 'Fatal Null Pointer', content: 'Ensure user object is defined' },
      { id: 'h2', severity: 'major', title: 'Pagination off by one', content: 'Index starts at 0' },
      { id: 'h3', severity: 'invalid_severity', content: 'Defaulted to minor' },
    ];

    const normalized = normalizeBugHints(raw);
    expect(normalized.length).toBe(4);
    expect(normalized[0].severity).toBe('minor');
    expect(normalized[1].severity).toBe('critical');
    expect(normalized[2].severity).toBe('major');
    expect(normalized[3].severity).toBe('minor');
  });

  it('renders nothing when hints array is empty or undefined', () => {
    const { container } = render(<BugHintsPanel hints={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders tiers in closed/collapsed state by default (PB-10 requirement)', () => {
    const testHints = [
      { id: 'c1', severity: 'critical' as const, title: 'Critical Auth Error', content: 'Check JWT token signature' },
      { id: 'm1', severity: 'major' as const, title: 'Query Performance', content: 'Missing index on email' },
      { id: 'min1', severity: 'minor' as const, title: 'Typo in Label', content: 'Change "Submmit" to "Submit"' },
    ];

    render(<BugHintsPanel hints={testHints} />);

    // Header exists
    expect(screen.getByText('Categorized Bug Hints')).toBeDefined();
    expect(screen.getByText(/3 hints available/i)).toBeDefined();

    // Critical button is collapsed
    const criticalButton = screen.getByRole('button', { name: /Critical/i });
    expect(criticalButton.getAttribute('aria-expanded')).toBe('false');

    // Hint contents should not be visible yet
    expect(screen.queryByText('Check JWT token signature')).toBeNull();
    expect(screen.queryByText('Missing index on email')).toBeNull();
  });

  it('expands severity tier on user click and reveals sanitized hint content', () => {
    const testHints = [
      {
        id: 'c1',
        severity: 'critical' as const,
        title: 'Critical Auth Error',
        content: 'Check `User.refreshToken` **hashing** and <script>alert(1)</script> raw tags.',
      },
    ];

    render(<BugHintsPanel hints={testHints} />);

    const criticalButton = screen.getByRole('button', { name: /Critical/i });
    expect(criticalButton.getAttribute('aria-expanded')).toBe('false');

    // User clicks to open hint
    fireEvent.click(criticalButton);

    expect(criticalButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Critical Auth Error')).toBeDefined();
    // Sanitizer stripped script tag
    expect(screen.queryByText('<script>alert(1)</script>')).toBeNull();

    // Clicking again collapses the section
    fireEvent.click(criticalButton);
    expect(criticalButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Critical Auth Error')).toBeNull();
  });
});
